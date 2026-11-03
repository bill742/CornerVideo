import "server-only";
import Stripe from "stripe";

import type { BillingInterval } from "@/types";

let client: Stripe | null = null;

/**
 * The Stripe client, or null when STRIPE_SECRET_KEY isn't set (local dev
 * without billing, CI builds). Callers treat null as "billing unavailable".
 *
 * STRIPE_SECRET_KEY is a Worker secret, read at runtime like TMDB_API_KEY —
 * see wrangler.jsonc. The fetch client is explicit because the Worker has no
 * Node http module to fall back on.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  return client;
}

/** Stripe price IDs per interval. Set in Stripe, so amounts aren't in code. */
export function getPriceId(interval: BillingInterval): string | undefined {
  return interval === "annual"
    ? process.env.STRIPE_PRICE_ANNUAL
    : process.env.STRIPE_PRICE_MONTHLY;
}
