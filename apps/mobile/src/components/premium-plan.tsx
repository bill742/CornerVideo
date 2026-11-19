import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  FREE_WATCHLIST_LIMIT,
  type Subscription,
  type SubscriptionPlatform,
} from "@moviewatchlist/shared";

import { APPLE_EULA_URL, PRIVACY_URL, TERMS_URL } from "@/lib/legal";
import type { Membership } from "@/lib/premium";
import {
  getPremiumOptions,
  manageSubscription,
  type PremiumOption,
  purchase,
  purchasesAvailable,
  restorePurchases,
} from "@/lib/purchases";
import { useBrand } from "@/lib/theme";


// Only what is actually gated today, matching the web Premium section.
const PERKS = [
  "Unlimited titles on My Shelf",
  "New release alerts on this device",
];

const PLATFORM_NAMES: Record<SubscriptionPlatform, string> = {
  apple: "the App Store",
  google: "Google Play",
  stripe: "your web membership",
  test: "a test purchase",
};

interface PremiumPlanProps {
  membership: Membership;
  /** Re-reads the membership after a purchase, restore or return from settings. */
  onChanged: () => Promise<void>;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusLine(row: Subscription): string | null {
  const end = formatDate(row.current_period_end);
  switch (row.status) {
    case "trialing":
      if (!end) return "You're on a free trial.";
      return row.cancel_at_period_end
        ? `Free trial — ends ${end}. You won't be charged.`
        : `Free trial — your first payment is on ${end}.`;
    case "active":
      if (row.cancel_at_period_end) {
        return end
          ? `Premium ends on ${end}. You won't be charged again.`
          : "Premium ends at the end of this billing period.";
      }
      return end ? `Renews on ${end}.` : "Premium is active.";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "Your last payment didn't go through. Update your payment method to keep Premium.";
    case "paused":
      return "Your subscription is paused.";
    default:
      return null;
  }
}

/** The Premium part of the Membership tab: status, purchase and restore. */
function PremiumPlan({ membership, onChanged }: PremiumPlanProps) {
  const { colors } = useBrand();
  const [options, setOptions] = useState<PremiumOption[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPremiumOptions()
        .then((next) => active && setOptions(next))
        .catch((err) => {
          console.warn("Could not load Premium offerings:", err);
          if (active) setOptions([]);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  async function run(task: () => Promise<string | null>) {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await task());
      await onChanged();
    } catch (err) {
      console.warn("Premium action failed:", err);
      setMessage("Something went wrong with the store. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const buy = (option: PremiumOption) =>
    run(async () => {
      switch (await purchase(option)) {
        case "cancelled":
          return null;
        case "pending":
          return "Your purchase went through. Premium will turn on shortly — check back in a few minutes.";
        default:
          return "Thanks for subscribing. Premium is on.";
      }
    });

  const restore = () =>
    run(async () =>
      (await restorePurchases())
        ? "Restore finished. Any Premium subscription on this store account is back."
        : "Restore finished. Premium will turn on shortly if this store account has a subscription.",
    );

  const row = membership.deviceRow;
  const ownsBilling =
    row !== null && row.status !== "cancelled" && row.platform !== "test";
  const canBuy = (options?.length ?? 0) > 0;

  // Hidden until this build can sell Premium (store keys and offerings
  // configured), unless the member already has something to show — the same
  // rule as the web Membership page.
  if (!purchasesAvailable() && !membership.premium && !row) return null;
  if (options === null) {
    return <ActivityIndicator className="mt-4" color={colors.primary} />;
  }
  if (!canBuy && !membership.premium && !row) return null;

  const status = row ? statusLine(row) : null;
  const viaElsewhere =
    membership.premium &&
    membership.premiumVia !== null &&
    membership.premiumVia !== row?.platform;
  const trialDays = options.find((option) => option.trialDays)?.trialDays;

  return (
    <View>
      <Text className="mt-8 text-xs uppercase tracking-wide text-muted">
        {membership.premium ? "Premium" : "Go Premium"}
      </Text>
      <View className="mt-3 gap-3">
        {viaElsewhere && membership.premiumVia ? (
          // No link to manage a web or other-store subscription from here: App
          // Review forbids steering members to buy or manage outside the app.
          <Text className="text-base text-fg">
            You have Premium through {PLATFORM_NAMES[membership.premiumVia]}.
          </Text>
        ) : null}

        {status ? <Text className="text-base text-fg">{status}</Text> : null}

        {ownsBilling ? (
          <Pressable
            accessibilityRole="button"
            className="items-center rounded-md border border-line px-4 py-3 active:opacity-80"
            disabled={busy}
            onPress={() => run(async () => (await manageSubscription(), null))}
          >
            <Text className="text-base font-semibold text-fg">
              Manage subscription
            </Text>
          </Pressable>
        ) : null}

        {!membership.premium && canBuy ? (
          <>
            {PERKS.map((perk) => (
              <Text className="text-sm text-muted" key={perk}>
                • {perk}
              </Text>
            ))}
            <Text className="text-sm text-muted">
              Free accounts keep up to {FREE_WATCHLIST_LIMIT} titles.
            </Text>

            {options.map((option, index) => (
              <Pressable
                accessibilityRole="button"
                className={`h-12 items-center justify-center rounded-md active:opacity-80 ${
                  index === 0 ? "bg-primary" : "border border-line"
                }`}
                disabled={busy}
                key={option.interval}
                onPress={() => buy(option)}
              >
                <Text
                  className={`text-base font-semibold ${
                    index === 0 ? "text-on-primary" : "text-fg"
                  }`}
                >
                  {option.price} /{" "}
                  {option.interval === "annual" ? "year" : "month"}
                </Text>
              </Pressable>
            ))}

            <Text className="text-xs text-muted">
              {trialDays
                ? `Starts with a ${trialDays}-day free trial, then the price above. `
                : ""}
              Payment is charged to your{" "}
              {Platform.OS === "ios" ? "Apple Account" : "Google Play account"}.
              The subscription renews automatically unless cancelled at least 24
              hours before the end of the current period. Manage or cancel it in
              your account settings.
            </Text>
            <View className="flex-row gap-4">
              <Text
                accessibilityRole="link"
                className="text-xs font-semibold text-fg underline"
                // Required on the purchase screen by App Review (3.1.2).
                // Apple's licence agreement covers App Store purchases;
                // Google Play buyers get our own Terms.
                onPress={() =>
                  Linking.openURL(
                    Platform.OS === "ios" ? APPLE_EULA_URL : TERMS_URL,
                  )
                }
              >
                Terms of Use
              </Text>
              <Text
                accessibilityRole="link"
                className="text-xs font-semibold text-fg underline"
                onPress={() => Linking.openURL(PRIVACY_URL)}
              >
                Privacy Policy
              </Text>
            </View>
          </>
        ) : null}

        {!ownsBilling && purchasesAvailable() ? (
          <Pressable
            accessibilityRole="button"
            className="items-center py-2"
            disabled={busy}
            onPress={restore}
          >
            <Text className="text-sm font-semibold text-fg">
              Restore purchases
            </Text>
          </Pressable>
        ) : null}

        {busy ? <ActivityIndicator color={colors.primary} /> : null}
        {message ? (
          <Text accessibilityLiveRegion="polite" className="text-sm text-fg">
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
PremiumPlan.displayName = "PremiumPlan";

export { PremiumPlan };
