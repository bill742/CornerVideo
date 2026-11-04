import type { SupabaseClient } from "@supabase/supabase-js";
import "server-only";

import { getPriceId, getStripe } from "@/lib/stripe";
import {
  type BillingInterval,
  PREMIUM_SUBSCRIPTION_COLUMNS,
  type Subscription,
  hasPremium,
} from "@/types";

/**
 * Whether a member has premium on any platform. Fails closed: a read error
 * counts as free, so an outage can't hand out unlimited shelves.
 */
export async function userHasPremium(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(PREMIUM_SUBSCRIPTION_COLUMNS)
    .eq("user_id", userId);
  if (error) {
    console.error("userHasPremium failed:", error.message);
    return false;
  }
  return hasPremium(data);
}

export interface Membership {
  premium: boolean;
  /** The web (Stripe) subscription, if the member has ever had one. */
  stripe: Subscription | null;
  /**
   * Premium through an app store — managed there, not in Stripe. "test" is a
   * RevenueCat Test Store purchase from a development build.
   */
  storePlatform: "apple" | "google" | "test" | null;
}

/** Everything the Membership page shows about a member's plan. */
export async function getMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<Membership> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId);
  if (error) console.error("getMembership failed:", error.message);

  const rows = (data as Subscription[] | null) ?? [];
  const store = rows.find(
    (row) => row.platform !== "stripe" && hasPremium([row])
  );
  return {
    premium: hasPremium(rows),
    storePlatform: store
      ? (store.platform as Exclude<Subscription["platform"], "stripe">)
      : null,
    stripe: rows.find((row) => row.platform === "stripe") ?? null,
  };
}

export type PremiumPrices = Partial<Record<BillingInterval, string>>;

/**
 * Display prices ("$4.99"), read from Stripe so changing a price there needs
 * no deploy. An interval whose price can't be read is left out; the page
 * offers only what it can price.
 */
export async function getPremiumPrices(): Promise<PremiumPrices> {
  const stripe = getStripe();
  if (!stripe) return {};

  const intervals: BillingInterval[] = ["monthly", "annual"];
  const entries = await Promise.all(
    intervals.map(async (interval) => {
      const id = getPriceId(interval);
      if (!id) return null;
      try {
        const price = await stripe.prices.retrieve(id);
        if (price.unit_amount === null) return null;
        const amount = new Intl.NumberFormat("en-CA", {
          currency: price.currency,
          style: "currency",
        }).format(price.unit_amount / 100);
        return [interval, amount] as const;
      } catch (err) {
        console.error(`Stripe price ${interval} failed:`, err);
        return null;
      }
    })
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}
