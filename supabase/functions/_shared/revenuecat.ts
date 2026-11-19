// RevenueCat → public.subscriptions, shared by revenuecat-webhook (RevenueCat
// calls it on every purchase event) and revenuecat-sync (the app calls it
// right after a purchase or restore, so Premium appears without waiting for
// the webhook).
//
// Both re-read the member from RevenueCat's REST API rather than trusting an
// event payload, as RevenueCat recommends: every event type then needs the
// same handling, and retried or out-of-order deliveries converge on
// RevenueCat's current state.
//
// RevenueCat's App User ID is the Supabase user id — the app logs in to
// RevenueCat with it (apps/mobile/src/lib/purchases.ts).

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { isDeletedMember } from "./deleted-member.ts";

export type StorePlatform = "apple" | "google" | "test";

/** Every platform this module owns. Stripe rows belong to stripe-webhook. */
export const STORE_PLATFORMS: readonly StorePlatform[] = [
  "apple",
  "google",
  "test",
];

const PLATFORM_BY_STORE: Record<string, StorePlatform> = {
  app_store: "apple",
  mac_app_store: "apple",
  play_store: "google",
  test_store: "test",
};

/** A subscription as GET /v1/subscribers/{id} returns it, keyed by product. */
export interface RevenueCatSubscription {
  auto_resume_date?: string | null;
  billing_issues_detected_at: string | null;
  expires_date: string | null;
  grace_period_expires_date: string | null;
  period_type: string;
  refunded_at: string | null;
  store: string;
  store_transaction_id?: number | string | null;
  unsubscribe_detected_at: string | null;
}

export interface SubscriptionRow {
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  external_id: string;
  platform: StorePlatform;
  status: "active" | "cancelled" | "past_due" | "paused" | "trialing";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Only Supabase user ids are ours. Anonymous RevenueCat ids
 * ("$RCAnonymousID:…") can turn up in aliases and transfers; they belong to
 * no member, so there is nothing to write for them.
 */
export function isMemberId(id: unknown): id is string {
  return typeof id === "string" && UUID.test(id);
}

function time(iso: string | null | undefined): number | null {
  return iso ? new Date(iso).getTime() : null;
}

/** When access actually ends: a billing grace period extends the expiry. */
function accessEnds(sub: RevenueCatSubscription): number | null {
  const expires = time(sub.expires_date);
  const grace = time(sub.grace_period_expires_date);
  if (expires === null) return null;
  return grace !== null && grace > expires ? grace : expires;
}

function toRow(
  productId: string,
  sub: RevenueCatSubscription,
  platform: StorePlatform,
  now: number,
): SubscriptionRow {
  const ends = accessEnds(sub);
  const live = ends === null || ends > now;
  // Refunds revoke access at once; everything else runs to the period end.
  let status: SubscriptionRow["status"];
  if (sub.refunded_at) status = "cancelled";
  else if (live) status = sub.period_type === "trial" ? "trialing" : "active";
  else if (sub.auto_resume_date) status = "paused";
  else if (sub.billing_issues_detected_at && !sub.unsubscribe_detected_at) {
    // The store is still retrying the payment.
    status = "past_due";
  } else status = "cancelled";

  return {
    cancel_at_period_end:
      (status === "active" || status === "trialing") &&
      sub.unsubscribe_detected_at !== null,
    current_period_end: ends === null ? null : new Date(ends).toISOString(),
    external_id: String(sub.store_transaction_id ?? productId),
    platform,
    status,
  };
}

/**
 * One row per store platform from a member's RevenueCat subscriptions. When a
 * platform has several (an old monthly and a new annual, say), the one whose
 * access runs latest wins — that's the one that decides Premium.
 */
export function rowsFromSubscriptions(
  subscriptions: Record<string, RevenueCatSubscription>,
  now: number = Date.now(),
  { allowTestStore = false }: { allowTestStore?: boolean } = {},
): Map<StorePlatform, SubscriptionRow> {
  const best = new Map<StorePlatform, { ends: number; row: SubscriptionRow }>();

  for (const [productId, sub] of Object.entries(subscriptions)) {
    const platform = PLATFORM_BY_STORE[sub.store];
    if (!platform) continue; // promotional, Stripe-via-RevenueCat, etc.
    if (platform === "test" && !allowTestStore) continue;

    const row = toRow(productId, sub, platform, now);
    // A refunded purchase never outranks one that still grants access.
    const ends =
      row.status === "cancelled" ? -Infinity : (accessEnds(sub) ?? Infinity);
    const current = best.get(platform);
    if (!current || ends > current.ends) best.set(platform, { ends, row });
  }

  return new Map([...best].map(([platform, { row }]) => [platform, row]));
}

/**
 * Test Store purchases are free, and the Test Store key is a public SDK key —
 * anyone holding it could "buy" Premium for their own member id. Since web and
 * mobile share one database, they only count while this is explicitly on.
 * Turn it off before launch; the member's next sync then cancels any test row.
 */
function testStoreAllowed(): boolean {
  return Deno.env.get("REVENUECAT_ALLOW_TEST_STORE") === "true";
}

async function fetchSubscriptions(
  userId: string,
  secretKey: string,
): Promise<Record<string, RevenueCatSubscription>> {
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );
  if (!res.ok) {
    throw new Error(
      `RevenueCat GET subscriber ${res.status}: ${await res.text()}`,
    );
  }
  const body = await res.json();
  return body.subscriber?.subscriptions ?? {};
}

/**
 * Brings a member's apple/google/test rows in line with RevenueCat. A platform
 * RevenueCat no longer lists (its purchases were transferred to another
 * account) has its row marked cancelled rather than left granting Premium.
 */
export async function syncMember(
  supabase: SupabaseClient,
  userId: string,
  secretKey: string,
): Promise<SubscriptionRow[]> {
  const rows = rowsFromSubscriptions(
    await fetchSubscriptions(userId, secretKey),
    Date.now(),
    { allowTestStore: testStoreAllowed() },
  );
  const updatedAt = new Date().toISOString();

  if (rows.size > 0) {
    const { error } = await supabase.from("subscriptions").upsert(
      [...rows.values()].map((row) => ({
        ...row,
        updated_at: updatedAt,
        user_id: userId,
      })),
      { onConflict: "user_id,platform" },
    );
    // The member deleted their account (delete-account); a late store event
    // has nothing to attach to. Report nothing synced rather than retrying.
    if (isDeletedMember(error)) return [];
    if (error) throw new Error(`subscriptions upsert: ${error.message}`);
  }

  const gone = STORE_PLATFORMS.filter((platform) => !rows.has(platform));
  if (gone.length > 0) {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        status: "cancelled",
        updated_at: updatedAt,
      })
      .eq("user_id", userId)
      .in("platform", gone)
      .neq("status", "cancelled");
    if (error) throw new Error(`subscriptions cancel: ${error.message}`);
  }

  return [...rows.values()];
}
