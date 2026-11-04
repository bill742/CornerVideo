// Run: npx deno test supabase/functions/_shared/revenuecat_test.ts

import { assertEquals } from "jsr:@std/assert@1";

import {
  isMemberId,
  type RevenueCatSubscription,
  rowsFromSubscriptions,
} from "./revenuecat.ts";

const NOW = Date.parse("2026-11-10T12:00:00Z");
const DAY = 86_400_000;
const iso = (offsetDays: number) =>
  new Date(NOW + offsetDays * DAY).toISOString();

function sub(
  overrides: Partial<RevenueCatSubscription>,
): RevenueCatSubscription {
  return {
    billing_issues_detected_at: null,
    expires_date: iso(20),
    grace_period_expires_date: null,
    period_type: "normal",
    refunded_at: null,
    store: "app_store",
    store_transaction_id: "2000000123",
    unsubscribe_detected_at: null,
    ...overrides,
  };
}

Deno.test("an App Store trial is trialing on the apple row", () => {
  const rows = rowsFromSubscriptions(
    { premium_monthly: sub({ expires_date: iso(7), period_type: "trial" }) },
    NOW,
  );
  assertEquals(rows.get("apple"), {
    cancel_at_period_end: false,
    current_period_end: iso(7),
    external_id: "2000000123",
    platform: "apple",
    status: "trialing",
  });
});

Deno.test(
  "stores map to their own platforms; unknown stores are ignored",
  () => {
    const rows = rowsFromSubscriptions(
      {
        a: sub({ store: "app_store" }),
        b: sub({ store: "play_store" }),
        c: sub({ store: "test_store" }),
        d: sub({ store: "promotional" }),
        e: sub({ store: "stripe" }),
      },
      NOW,
      { allowTestStore: true },
    );
    assertEquals([...rows.keys()].sort(), ["apple", "google", "test"]);
  },
);

Deno.test("Test Store purchases are ignored unless explicitly allowed", () => {
  const rows = rowsFromSubscriptions(
    { a: sub({ store: "test_store" }), b: sub({ store: "app_store" }) },
    NOW,
  );
  assertEquals([...rows.keys()], ["apple"]);
});

Deno.test(
  "cancelled but not yet expired stays active until the period end",
  () => {
    const row = rowsFromSubscriptions(
      { m: sub({ unsubscribe_detected_at: iso(-1) }) },
      NOW,
    ).get("apple");
    assertEquals(row?.status, "active");
    assertEquals(row?.cancel_at_period_end, true);
  },
);

Deno.test("expired after cancelling is cancelled", () => {
  const row = rowsFromSubscriptions(
    { m: sub({ expires_date: iso(-1), unsubscribe_detected_at: iso(-5) }) },
    NOW,
  ).get("apple");
  assertEquals(row?.status, "cancelled");
  assertEquals(row?.cancel_at_period_end, false);
});

Deno.test("a billing grace period keeps access and moves the end date", () => {
  const row = rowsFromSubscriptions(
    {
      m: sub({
        billing_issues_detected_at: iso(-2),
        expires_date: iso(-1),
        grace_period_expires_date: iso(5),
      }),
    },
    NOW,
  ).get("apple");
  assertEquals(row?.status, "active");
  assertEquals(row?.current_period_end, iso(5));
});

Deno.test("expired with the store still retrying payment is past_due", () => {
  const row = rowsFromSubscriptions(
    { m: sub({ billing_issues_detected_at: iso(-2), expires_date: iso(-1) }) },
    NOW,
  ).get("apple");
  assertEquals(row?.status, "past_due");
});

Deno.test("a refund revokes access immediately", () => {
  const row = rowsFromSubscriptions(
    { m: sub({ refunded_at: iso(-1) }) },
    NOW,
  ).get("apple");
  assertEquals(row?.status, "cancelled");
});

Deno.test("a paused Play subscription is paused", () => {
  const row = rowsFromSubscriptions(
    {
      m: sub({
        auto_resume_date: iso(10),
        expires_date: iso(-1),
        store: "play_store",
      }),
    },
    NOW,
  ).get("google");
  assertEquals(row?.status, "paused");
});

Deno.test(
  "the subscription with the latest access wins within a platform",
  () => {
    const row = rowsFromSubscriptions(
      {
        old_monthly: sub({
          expires_date: iso(-30),
          store_transaction_id: "old",
        }),
        new_annual: sub({
          expires_date: iso(300),
          store_transaction_id: "new",
        }),
      },
      NOW,
    ).get("apple");
    assertEquals(row?.external_id, "new");
    assertEquals(row?.status, "active");
  },
);

Deno.test("a refunded newer purchase doesn't outrank a live older one", () => {
  const row = rowsFromSubscriptions(
    {
      live: sub({ expires_date: iso(10), store_transaction_id: "live" }),
      refunded: sub({
        expires_date: iso(300),
        refunded_at: iso(-1),
        store_transaction_id: "refunded",
      }),
    },
    NOW,
  ).get("apple");
  assertEquals(row?.external_id, "live");
});

Deno.test("only Supabase user ids count as members", () => {
  assertEquals(isMemberId("5f0c2a7e-0d1b-4c4e-9a52-2f6f0e3b9c11"), true);
  assertEquals(
    isMemberId("$RCAnonymousID:8069238d6049ce87cc529853916d624c"),
    false,
  );
  assertEquals(isMemberId(undefined), false);
});
