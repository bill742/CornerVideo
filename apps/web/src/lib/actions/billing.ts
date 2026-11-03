"use server";

import { redirect } from "next/navigation";

import { userHasPremium } from "@/lib/billing";
import { getPriceId, getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { type BillingInterval, PREMIUM_TRIAL_DAYS } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cornervideo.app";
const PROFILE_URL = `${siteUrl}/profile`;

/*
 * Both actions are plain form actions that end in a redirect — to Stripe on
 * success, back to /profile with a ?billing= flag otherwise — so they work
 * without client JS and never surface a thrown error's message (which a
 * production build replaces with a generic notice anyway).
 *
 * The subscription row itself is written only by the stripe-webhook Edge
 * Function. Nothing here trusts the redirect back from Checkout.
 */

async function getStripeCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("stripe_customers")
    .select("customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.customer_id ?? null;
}

export async function startCheckout(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fprofile");

  // Already premium (on any platform): a second checkout would double-bill.
  if (await userHasPremium(supabase, user.id)) {
    redirect("/profile");
  }

  const interval: BillingInterval =
    formData.get("interval") === "annual" ? "annual" : "monthly";
  const stripe = getStripe();
  const price = getPriceId(interval);
  if (!stripe || !price) {
    // Logged so the generic notice can be traced to its cause.
    console.warn(
      `startCheckout unavailable: ${!stripe ? "STRIPE_SECRET_KEY unset" : `no price ID for ${interval}`}`
    );
    redirect("/profile?billing=unavailable");
  }

  const [customer, { count: pastSubscriptions }] = await Promise.all([
    getStripeCustomerId(supabase, user.id),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("platform", "stripe")
      // Hand-granted rows have no Stripe ID and don't use up the trial.
      .not("external_id", "is", null),
  ]);

  let url: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      cancel_url: `${PROFILE_URL}?checkout=cancelled`,
      // The webhook reads this to link the new customer to the member.
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        metadata: { supabase_user_id: user.id },
        // The trial is for first-time subscribers only.
        ...(pastSubscriptions ? {} : { trial_period_days: PREMIUM_TRIAL_DAYS }),
      },
      success_url: `${PROFILE_URL}?checkout=success`,
      ...(customer ? { customer } : { customer_email: user.email }),
    });
    url = session.url;
  } catch (err) {
    console.error("startCheckout failed:", err);
  }

  // redirect() throws to unwind, so it stays outside the try.
  redirect(url ?? "/profile?billing=error");
}

export async function openBillingPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fprofile");

  const stripe = getStripe();
  const customer = await getStripeCustomerId(supabase, user.id);
  if (!stripe || !customer) {
    console.warn(
      `openBillingPortal unavailable: ${!stripe ? "STRIPE_SECRET_KEY unset" : "no stripe_customers row"}`
    );
    redirect("/profile?billing=unavailable");
  }

  let url: string | null = null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: PROFILE_URL,
    });
    url = session.url;
  } catch (err) {
    console.error("openBillingPortal failed:", err);
  }

  redirect(url ?? "/profile?billing=error");
}
