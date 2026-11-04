import { Platform } from "react-native";
import {
  PREMIUM_SUBSCRIPTION_COLUMNS,
  type Subscription,
  type SubscriptionPlatform,
  hasPremium,
} from "@moviewatchlist/shared";

import { supabase } from "./supabase";

/**
 * Whether the signed-in user holds an active premium subscription on any
 * platform.
 *
 * Reads the `subscriptions` rows the Stripe and RevenueCat webhooks
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

export interface Membership {
  premium: boolean;
  /** The platform granting Premium, preferring this device's own store. */
  premiumVia: SubscriptionPlatform | null;
  /**
   * This device's subscription row: its store's (apple on iOS, google on
   * Android), or the Test Store's in development builds — whichever is newer.
   * Null if the member has never bought Premium here.
   */
  deviceRow: Subscription | null;
}

/** The store platforms this device can buy from or manage. */
export function devicePlatforms(): SubscriptionPlatform[] {
  const store: SubscriptionPlatform =
    Platform.OS === "ios" ? "apple" : "google";
  return __DEV__ ? [store, "test"] : [store];
}

/** Everything the Membership tab shows about a member's plan. */
export async function getMembership(): Promise<Membership> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { deviceRow: null, premium: false, premiumVia: null };

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id);
  if (error) console.warn("getMembership failed:", error.message);

  const rows = (data as Subscription[] | null) ?? [];
  const mine = devicePlatforms();
  const deviceRow =
    rows
      .filter((row) => mine.includes(row.platform))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;
  const granting = rows.filter((row) => hasPremium([row]));
  const via =
    granting.find((row) => mine.includes(row.platform)) ?? granting[0] ?? null;

  return {
    deviceRow,
    premium: granting.length > 0,
    premiumVia: via?.platform ?? null,
  };
}
