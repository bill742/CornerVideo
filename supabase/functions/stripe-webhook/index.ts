// Stripe → public.subscriptions.
//
// Stripe calls this for checkout and subscription events. It is deployed with
// JWT verification off (supabase/config.toml) because Stripe sends no Supabase
// JWT — the Stripe-Signature check below is what authenticates the request.
//
// Writes use the service role, which bypasses RLS: members can only read
// their own subscriptions and stripe_customers rows, never write them.
//
// Every event re-fetches the subscription from Stripe rather than trusting the
// payload, so retried or out-of-order deliveries all converge on Stripe's
// current state.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@23";

import { isDeletedMember } from "../_shared/deleted-member.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
// Deno has no synchronous Node crypto, so signatures go through SubtleCrypto.
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to every Edge Function.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

type StoredStatus =
  | "active"
  | "cancelled"
  | "incomplete"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";

const STATUS_MAP: Record<Stripe.Subscription.Status, StoredStatus> = {
  active: "active",
  canceled: "cancelled",
  incomplete: "incomplete",
  incomplete_expired: "cancelled",
  past_due: "past_due",
  paused: "paused",
  trialing: "trialing",
  unpaid: "unpaid",
};

function customerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
) {
  return typeof customer === "string" ? customer : customer.id;
}

/** The member a subscription belongs to: its metadata, else the customer map. */
async function resolveUserId(sub: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = sub.metadata?.supabase_user_id;
  if (fromMetadata) return fromMetadata;

  const { data, error } = await supabase
    .from("stripe_customers")
    .select("user_id")
    .eq("customer_id", customerId(sub.customer))
    .maybeSingle();
  if (error) throw new Error(`stripe_customers lookup: ${error.message}`);
  return data?.user_id ?? null;
}

/** Resolves false when the member's account has been deleted. */
async function linkCustomer(
  userId: string,
  customer: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("stripe_customers")
    .upsert(
      { customer_id: customer, user_id: userId },
      { onConflict: "user_id" },
    );
  if (isDeletedMember(error)) return false;
  if (error) throw new Error(`stripe_customers upsert: ${error.message}`);
  return true;
}

async function syncSubscription(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = await resolveUserId(sub);
  if (!userId) {
    // Not one of ours (e.g. created by hand in the dashboard). Acknowledge it
    // so Stripe stops retrying; there is no member to attach it to.
    console.warn(`No member for subscription ${sub.id}; skipping.`);
    return;
  }

  // delete-account removes the member's auth user (deleting their Stripe
  // customer first), and Stripe still reports the cancellation afterwards.
  // Writing for them fails the foreign key; acknowledge instead of retrying.
  if (!(await linkCustomer(userId, customerId(sub.customer)))) {
    console.warn(`Member ${userId} was deleted; skipping ${sub.id}.`);
    return;
  }

  // The period now lives on each item. Every item renews together on one
  // plan, so the latest end is the subscription's.
  const periodEnd = Math.max(
    0,
    ...sub.items.data.map((item) => item.current_period_end),
  );

  const { error } = await supabase.from("subscriptions").upsert(
    {
      // The portal may cancel with a date (cancel_at) instead of the flag.
      cancel_at_period_end: sub.cancel_at_period_end || sub.cancel_at !== null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      external_id: sub.id,
      platform: "stripe",
      status: STATUS_MAP[sub.status],
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    { onConflict: "user_id,platform" },
  );
  if (error) throw new Error(`subscriptions upsert: ${error.message}`);
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) return;
      // Link first: the customer exists before the subscription row does, and
      // client_reference_id is the one place the member's id is guaranteed.
      if (
        session.client_reference_id &&
        session.customer &&
        !(await linkCustomer(
          session.client_reference_id,
          customerId(session.customer),
        ))
      ) {
        return;
      }
      const id =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      await syncSubscription(id);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await syncSubscription(event.data.object.id);
      return;
    default:
      // Subscribed to more than we handle in the dashboard; nothing to do.
      return;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!webhookSecret) {
    // A 500 (not 400) so Stripe keeps retrying: once the secret is set, the
    // retries go through and no event is lost.
    console.error(
      "STRIPE_WEBHOOK_SECRET is not set; run `supabase secrets set`.",
    );
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    // Logged so a wrong STRIPE_WEBHOOK_SECRET isn't mistaken for a forgery.
    console.error("Stripe signature verification failed:", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    await handle(event);
  } catch (err) {
    // 500 makes Stripe retry with backoff, which covers transient DB errors.
    console.error(`Handling ${event.type} (${event.id}) failed:`, err);
    return new Response("Handler failed", { status: 500 });
  }

  return Response.json({ received: true });
});
