// Deletes the signed-in member's account. Both apps call it from their
// Membership screens (App Review guideline 5.1.1(v) requires in-app deletion).
//
// It only ever deletes the caller, read from their session, so a member can't
// use it on anyone else. In order:
//
// 1. Stripe: deletes the member's Stripe customer, which cancels any web
//    subscription immediately so nobody is billed for an account that's gone.
//    If this fails the account is NOT deleted — better a retry than a member
//    who keeps paying with no way left to cancel.
// 2. RevenueCat: deletes the subscriber record (purchase history keyed by the
//    member's id). Best-effort: App Store and Google Play subscriptions are
//    billed by the store and can't be cancelled from here, which the apps
//    tell the member before they confirm.
// 3. Supabase: deletes the auth user. Every app table references auth.users
//    ON DELETE CASCADE, so the shelf, episodes, profile, subscriptions and
//    stripe_customers rows go with it.
//
// Late Stripe or RevenueCat webhooks for the deleted member hit a foreign-key
// error on write; both webhooks treat that as "member gone" and acknowledge
// the event (see _shared/deleted-member.ts) instead of retrying for days.
//
// JWT verification is off in supabase/config.toml and done here with
// auth.getUser(), as in revenuecat-sync.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@23";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = stripeKey ? new Stripe(stripeKey) : null;
const revenueCatKey = Deno.env.get("REVENUECAT_SECRET_KEY");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

async function deleteStripeCustomer(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("stripe_customers")
    .select("customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`stripe_customers lookup: ${error.message}`);
  if (!data) return;

  if (!stripe) {
    // A customer row exists, so this member has been billed by Stripe; going
    // ahead would leave a live subscription nobody can cancel.
    throw new Error(
      "STRIPE_SECRET_KEY is not set, so the customer can't be closed.",
    );
  }

  try {
    await stripe.customers.del(data.customer_id);
  } catch (err) {
    // Already deleted (by hand, or an earlier attempt that failed later on).
    if (
      err instanceof Stripe.errors.StripeError &&
      err.code === "resource_missing"
    ) {
      return;
    }
    throw err;
  }
}

async function deleteRevenueCatSubscriber(userId: string): Promise<void> {
  if (!revenueCatKey) return;

  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    {
      headers: { Authorization: `Bearer ${revenueCatKey}` },
      method: "DELETE",
    },
  );
  // 404: this member never opened the mobile app.
  if (!res.ok && res.status !== 404) {
    console.warn(
      `RevenueCat DELETE subscriber ${res.status} for ${userId}: ${await res.text()}`,
    );
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const {
    data: { user },
  } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    await deleteStripeCustomer(user.id);
  } catch (err) {
    console.error(`delete-account: Stripe step failed for ${user.id}:`, err);
    return new Response("Could not close billing", { status: 502 });
  }

  try {
    await deleteRevenueCatSubscriber(user.id);
  } catch (err) {
    console.warn(`delete-account: RevenueCat step failed for ${user.id}:`, err);
  }

  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    console.error(`delete-account: deleteUser failed for ${user.id}:`, error);
    return new Response("Could not delete account", { status: 500 });
  }

  return Response.json({ deleted: true });
});
