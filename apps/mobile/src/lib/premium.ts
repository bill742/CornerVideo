import {
  PREMIUM_SUBSCRIPTION_COLUMNS,
  hasPremium,
} from "@moviewatchlist/shared";

import { supabase } from "./supabase";

/**
 * Whether the signed-in user holds an active premium subscription on any
 * platform.
 *
 * Reads the `subscriptions` rows the Stripe webhook (and later RevenueCat)
 * maintain — one per platform, so this selects them all rather than expecting
 * a single row.
 *
 * Fails closed: any error reads as "not premium".
 */
export async function isPremium(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("subscriptions")
    .select(PREMIUM_SUBSCRIPTION_COLUMNS)
    .eq("user_id", user.id);

  if (error) return false;
  return hasPremium(data);
}
