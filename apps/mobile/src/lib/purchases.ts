import { Linking, Platform } from "react-native";
import Purchases, {
  PURCHASES_ERROR_CODE,
  type PurchasesError,
  type PurchasesPackage,
} from "react-native-purchases";
import type { BillingInterval } from "@moviewatchlist/shared";

import { supabase } from "./supabase";

/*
 * In-app purchases through RevenueCat. The RevenueCat App User ID is always
 * the Supabase user id, which is how the revenuecat-webhook and
 * revenuecat-sync Edge Functions know whose `subscriptions` row to write.
 * Nothing here writes Premium itself: the database stays the one source of
 * truth for both apps (isPremium() in ./premium).
 */

// Public SDK keys — safe in the bundle, unlike RevenueCat's secret key.
const TEST_STORE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY;
const PLATFORM_KEY =
  Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

/**
 * Development builds use the Test Store when its key is set. Release builds
 * never do: the SDK deliberately crashes a release build that carries a Test
 * Store key, so that one can't reach the stores by accident.
 */
function apiKey(): string | null {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
  if (__DEV__ && TEST_STORE_KEY) return TEST_STORE_KEY;
  return PLATFORM_KEY || null;
}

let configured = false;

/** Whether this build can sell Premium at all. */
function purchasesAvailable(): boolean {
  return apiKey() !== null;
}

/**
 * Points RevenueCat at the signed-in member, or detaches it on sign-out.
 * Called from AuthProvider whenever the session's user changes. Configuring
 * waits for a member, so RevenueCat never mints an anonymous id whose
 * purchases would belong to nobody.
 */
async function identifyPurchaser(userId: string | null): Promise<void> {
  const key = apiKey();
  if (!key) return;

  if (!configured) {
    if (!userId) return;
    Purchases.configure({ apiKey: key, appUserID: userId });
    configured = true;
    return;
  }

  if (userId) {
    await Purchases.logIn(userId);
  } else if (!(await Purchases.isAnonymous())) {
    await Purchases.logOut();
  }
}

interface PremiumOption {
  interval: BillingInterval;
  pkg: PurchasesPackage;
  /** Localised by the store, e.g. "$4.99" or "4,99 €". */
  price: string;
  /** Free-trial length in days when the store offers one, else null. */
  trialDays: number | null;
}

const DAYS_PER_UNIT: Record<string, number> = {
  DAY: 1,
  MONTH: 30,
  WEEK: 7,
  YEAR: 365,
};

/**
 * The monthly and annual packages of the current offering (set up in the
 * RevenueCat dashboard), in that order. Empty when nothing is configured or
 * the store can't be reached — the Premium section then stays hidden.
 */
async function getPremiumOptions(): Promise<PremiumOption[]> {
  if (!configured) return [];
  const { current } = await Purchases.getOfferings();
  const options: PremiumOption[] = [];

  for (const [interval, pkg] of [
    ["monthly", current?.monthly],
    ["annual", current?.annual],
  ] as const) {
    if (!pkg) continue;
    const intro = pkg.product.introPrice;
    options.push({
      interval,
      pkg,
      price: pkg.product.priceString,
      trialDays:
        intro && intro.price === 0
          ? intro.periodNumberOfUnits * (DAYS_PER_UNIT[intro.periodUnit] ?? 1)
          : null,
    });
  }
  return options;
}

/**
 * Asks the server to re-read this member from RevenueCat. Without it, Premium
 * would wait on the webhook — and a restore of a purchase already on this
 * account sends no webhook at all.
 */
async function syncPremium(): Promise<void> {
  const { error } = await supabase.functions.invoke("revenuecat-sync", {
    method: "POST",
  });
  if (error) throw error;
}

/**
 * Syncs after the store has already taken the purchase or restore. A failure
 * here isn't a store failure — the webhook still delivers Premium — so it
 * resolves false instead of throwing, and the screen can say so.
 */
async function trySyncPremium(): Promise<boolean> {
  try {
    await syncPremium();
    return true;
  } catch (err) {
    console.warn("Premium sync failed; waiting on the webhook:", err);
    return false;
  }
}

type PurchaseResult = "cancelled" | "pending" | "synced";

/**
 * Buys a package. "cancelled" if the member backed out of the sheet,
 * "pending" if the store took the purchase but Premium isn't on yet.
 */
async function purchase(option: PremiumOption): Promise<PurchaseResult> {
  try {
    await Purchases.purchasePackage(option.pkg);
  } catch (err) {
    if (
      (err as PurchasesError).code ===
      PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      return "cancelled";
    }
    throw err;
  }
  return (await trySyncPremium()) ? "synced" : "pending";
}

/**
 * Store review requires a way to restore purchases on a new device. Resolves
 * false when the restore worked but Premium isn't on yet.
 */
async function restorePurchases(): Promise<boolean> {
  await Purchases.restorePurchases();
  return trySyncPremium();
}

const PLAY_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions?package=app.cornervideo";

/**
 * Opens the platform's own subscription settings: Apple's sheet on iOS (the
 * SDK call is iOS-only), RevenueCat's management URL — or Play's
 * subscriptions page — on Android.
 */
async function manageSubscription(): Promise<void> {
  if (Platform.OS === "ios") {
    await Purchases.showManageSubscriptions();
    return;
  }
  const { managementURL } = await Purchases.getCustomerInfo();
  await Linking.openURL(managementURL ?? PLAY_SUBSCRIPTIONS_URL);
}

export {
  getPremiumOptions,
  identifyPurchaser,
  manageSubscription,
  type PremiumOption,
  purchase,
  type PurchaseResult,
  purchasesAvailable,
  restorePurchases,
  syncPremium,
};
