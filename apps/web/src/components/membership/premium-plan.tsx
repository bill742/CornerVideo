import { openBillingPortal, startCheckout } from "@/lib/actions/billing";
import type { Membership, PremiumPrices } from "@/lib/billing";
import { FREE_WATCHLIST_LIMIT, PREMIUM_TRIAL_DAYS } from "@/types";

import { BillingSubmitButton } from "./billing-submit-button";
import { ClearBillingFlag } from "./clear-billing-flag";

/** Outcome flags the billing actions and Stripe redirect back with. */
type BillingNotice =
  | "cancelled"
  | "error"
  | "success"
  | "unavailable"
  | undefined;

interface PremiumPlanProps {
  membership: Membership;
  notice: BillingNotice;
  prices: PremiumPrices;
}

// Only what is actually gated today. Add perks here as their gates land.
const PERKS = [
  "Unlimited titles on My Shelf",
  "New release alerts in the mobile app",
];

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Notice({ notice }: { notice: BillingNotice }) {
  if (!notice) return null;
  // Payments copy stays plain — see the brand guide.
  const copy = {
    cancelled: {
      text: "Checkout was cancelled. You haven't been charged.",
      tone: "info",
    },
    error: {
      text: "Something went wrong with billing. Try again in a moment.",
      tone: "error",
    },
    success: {
      text: "Thanks for subscribing. Premium turns on within a minute — refresh this page if it hasn't yet.",
      tone: "info",
    },
    unavailable: {
      text: "Billing isn't available right now. Try again later.",
      tone: "error",
    },
  }[notice];

  return (
    <>
      <ClearBillingFlag />
      <p
        className={
          copy.tone === "error"
            ? "bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
            : "bg-new-release/10 text-new-release rounded-md px-3 py-2 text-sm"
        }
        role={copy.tone === "error" ? "alert" : "status"}
      >
        {copy.text}
      </p>
    </>
  );
}

function statusLine(membership: Membership): string | null {
  const sub = membership.stripe;
  if (!sub) return null;
  // Rows the webhook writes always carry a Stripe ID and a period end. One
  // without an ID was granted by hand (support, testing), so there is no
  // billing to describe or manage.
  if (!sub.external_id) {
    return membership.premium ? "Premium is active on your account." : null;
  }
  const end = formatDate(sub.current_period_end);

  switch (sub.status) {
    case "trialing":
      if (!end) return "You're on a free trial.";
      return sub.cancel_at_period_end
        ? `Free trial — ends ${end}. You won't be charged.`
        : `Free trial — your first payment is on ${end}.`;
    case "active":
      if (sub.cancel_at_period_end) {
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

/** The Premium section of the Membership page: status and billing actions. */
function PremiumPlan({ membership, notice, prices }: PremiumPlanProps) {
  const sub = membership.stripe;
  const canBuy = Boolean(prices.monthly || prices.annual);

  // Hidden until billing is configured (no STRIPE_* secrets on the Worker
  // yet), so the live site doesn't advertise something it can't sell. A
  // member who already has Premium or a past subscription still sees it.
  if (!canBuy && !membership.premium && !sub) return null;

  // Only a webhook-written row (it has a Stripe ID) has a billing portal.
  const hasStripeBilling =
    sub !== null && sub.external_id !== null && sub.status !== "cancelled";
  const status = statusLine(membership);
  const firstTime = sub === null;

  return (
    <section aria-labelledby="premium-heading" className="max-w-xl space-y-4">
      <h2 className="text-xl font-semibold" id="premium-heading">
        {membership.premium ? "Premium" : "Go Premium"}
      </h2>

      <Notice notice={notice} />

      {membership.storePlatform && !hasStripeBilling ? (
        <p className="text-sm">
          You have Premium through{" "}
          {membership.storePlatform === "apple"
            ? "the App Store"
            : "Google Play"}
          . Manage it from your device&apos;s subscription settings.
        </p>
      ) : null}

      {status ? <p className="text-sm">{status}</p> : null}

      {hasStripeBilling ? (
        <form action={openBillingPortal}>
          <BillingSubmitButton variant="outline">
            Manage billing
          </BillingSubmitButton>
        </form>
      ) : null}

      {!membership.premium && !hasStripeBilling ? (
        <div className="space-y-4">
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            {PERKS.map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm">
            Free accounts keep up to {FREE_WATCHLIST_LIMIT} titles.
          </p>

          {canBuy ? (
            <form action={startCheckout} className="flex flex-wrap gap-3">
              {prices.monthly ? (
                <BillingSubmitButton name="interval" value="monthly">
                  {prices.monthly} / month
                </BillingSubmitButton>
              ) : null}
              {prices.annual ? (
                <BillingSubmitButton
                  name="interval"
                  value="annual"
                  variant={prices.monthly ? "outline" : "default"}
                >
                  {prices.annual} / year
                </BillingSubmitButton>
              ) : null}
            </form>
          ) : (
            <p className="text-sm">
              Premium isn&apos;t available to buy right now.
            </p>
          )}

          {firstTime && canBuy ? (
            <p className="text-muted-foreground text-xs">
              Starts with a {PREMIUM_TRIAL_DAYS}-day free trial. Cancel any time
              before it ends and you won&apos;t be charged. Payments are handled
              securely by Stripe.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

PremiumPlan.displayName = "PremiumPlan";

export { type BillingNotice, PremiumPlan };
