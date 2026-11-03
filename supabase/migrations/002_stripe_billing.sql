-- ─── Subscriptions: one row per platform ─────────────────────────────────────
-- A member can subscribe on the web (Stripe) and in an app store (Apple or
-- Google) at once, and cancelling one must not touch the other. 001 allowed a
-- single row per user, so the second platform's webhook would overwrite the
-- first. Rows are now keyed by (user_id, platform).

ALTER TABLE public.subscriptions
  DROP CONSTRAINT subscriptions_user_id_key,
  ADD CONSTRAINT subscriptions_user_id_platform_key UNIQUE (user_id, platform);

-- Stripe statuses that don't fold into the original four. Only 'active' and
-- 'trialing' grant premium; the rest are kept so the Membership page can say
-- why. Stripe's 'canceled' and 'incomplete_expired' are stored as 'cancelled'.
ALTER TABLE public.subscriptions
  DROP CONSTRAINT subscriptions_status_check,
  ADD CONSTRAINT subscriptions_status_check CHECK (
    status IN ('active', 'trialing', 'cancelled', 'past_due', 'incomplete', 'unpaid', 'paused')
  );

-- Set when the member cancels from the billing portal: still premium until
-- current_period_end, then the webhook flips status to 'cancelled'.
ALTER TABLE public.subscriptions
  ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

-- Writes come only from the webhook Edge Function (service role, which
-- bypasses RLS). Members keep the read-only policy from 001.

-- ─── Stripe customers ─────────────────────────────────────────────────────────
-- Maps a member to their Stripe customer, so a repeat checkout reuses it and
-- the billing portal knows whose billing to open. Written only by the webhook:
-- an insert policy would let a member point their row at someone else's
-- customer and open that person's billing portal.

CREATE TABLE public.stripe_customers (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  customer_id TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Stripe customer"
  ON public.stripe_customers FOR SELECT
  USING (auth.uid() = user_id);
