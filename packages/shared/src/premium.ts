import type { Subscription } from "./types";

type PremiumFields = Pick<Subscription, "current_period_end" | "status">;

/** Columns both apps select when deciding premium access. */
export const PREMIUM_SUBSCRIPTION_COLUMNS = "status, current_period_end";

/** Days of Premium a first-time web subscriber gets before the first charge. */
export const PREMIUM_TRIAL_DAYS = 7;

/**
 * Whether any of a member's subscription rows grants premium right now.
 *
 * A member has at most one row per platform (Stripe, Apple, Google), and any
 * one of them is enough — cancelling on the web must not lock out an App Store
 * subscriber. A lapsed period end overrides the status, in case a webhook that
 * would have flipped it was missed.
 */
export function hasPremium(
  rows: readonly PremiumFields[] | null | undefined,
  now: number = Date.now(),
): boolean {
  return (rows ?? []).some(
    (row) =>
      (row.status === "active" || row.status === "trialing") &&
      (!row.current_period_end ||
        new Date(row.current_period_end).getTime() > now),
  );
}
