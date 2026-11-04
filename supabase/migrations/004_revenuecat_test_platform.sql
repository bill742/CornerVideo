-- ─── Subscriptions: a platform for RevenueCat Test Store purchases ───────────
-- Development builds buy from RevenueCat's Test Store, which needs no App Store
-- Connect or Play Console setup. Those purchases are stored under their own
-- platform, so a test purchase never overwrites (or masquerades as) a real
-- Apple or Google one. Like Stripe test mode, a test row does grant premium:
-- that's what lets the whole flow be tried end to end.

ALTER TABLE public.subscriptions
  DROP CONSTRAINT subscriptions_platform_check,
  ADD CONSTRAINT subscriptions_platform_check
    CHECK (platform IN ('stripe', 'apple', 'google', 'test'));
