-- Weekly launch numbers for the Monday check-in (docs/cornervideo-marketing-plan.md
-- → Measurement). Paste into the Supabase SQL editor and run; it only reads.
--
-- Covers the seven days up to now. To look at an earlier week, change
-- `week_end` in the params CTE (e.g. timestamptz '2026-11-30 00:00-05').
--
-- One row per number: section, metric, value. Visitors aren't here; they
-- come from Cloudflare Web Analytics, filtered by the same utm_source tags.

WITH params AS (
  SELECT now() AS week_end, now() - interval '7 days' AS week_start
),

new_members AS (
  SELECT p.id, p.created_at, p.utm_source, p.heard_from, p.app_news_opt_in
  FROM public.profiles p, params
  WHERE p.created_at >= params.week_start AND p.created_at < params.week_end
),

-- Activity is any shelf change or episode ticked. updated_at moves when a
-- title's status changes, added_at when it's added.
active_members AS (
  SELECT w.user_id
  FROM public.watchlist_items w, params
  WHERE greatest(w.added_at, w.updated_at) >= params.week_start
    AND greatest(w.added_at, w.updated_at) < params.week_end
  UNION
  SELECT e.user_id
  FROM public.episode_watches e, params
  WHERE e.watched_at >= params.week_start AND e.watched_at < params.week_end
),

-- The first time each member hit the free limit this week.
limit_hits AS (
  SELECT h.user_id, min(h.created_at) AS first_hit
  FROM public.shelf_limit_hits h, params
  WHERE h.created_at >= params.week_start AND h.created_at < params.week_end
  GROUP BY h.user_id
),

-- Premium as the apps decide it (packages/shared/src/premium.ts), minus
-- RevenueCat Test Store rows, which are free test purchases.
premium_members AS (
  SELECT DISTINCT s.user_id
  FROM public.subscriptions s
  WHERE s.status IN ('active', 'trialing') AND s.platform <> 'test'
)

-- ── Sign up ──────────────────────────────────────────────────────────────────
SELECT '1 sign up' AS section, 'new accounts' AS metric,
       count(*)::text AS value
FROM new_members

UNION ALL
SELECT '1 sign up', 'by utm_source: ' || coalesce(utm_source, '(none)'),
       count(*)::text
FROM new_members GROUP BY utm_source

UNION ALL
SELECT '1 sign up', 'heard from: ' || coalesce(heard_from, '(not answered)'),
       count(*)::text
FROM new_members GROUP BY heard_from

-- ── Activate: 5+ titles within a day of signing up ───────────────────────────
UNION ALL
SELECT '2 activate', 'new accounts with 5+ titles in their first 24 hours',
       count(*)::text || ' of ' || (SELECT count(*) FROM new_members)
FROM new_members m
WHERE (
  SELECT count(*) FROM public.watchlist_items w
  WHERE w.user_id = m.id AND w.added_at < m.created_at + interval '24 hours'
) >= 5

-- ── Retain ───────────────────────────────────────────────────────────────────
UNION ALL
SELECT '3 retain', 'weekly active shelves', count(*)::text
FROM active_members

UNION ALL
SELECT '3 retain', 'all accounts', count(*)::text
FROM public.profiles

-- ── Waitlist ─────────────────────────────────────────────────────────────────
UNION ALL
SELECT '4 waitlist', 'new waitlist emails this week', count(*)::text
FROM public.waitlist w, params
WHERE w.created_at >= params.week_start AND w.created_at < params.week_end

UNION ALL
SELECT '4 waitlist', 'new accounts opting in to app news',
       count(*) FILTER (WHERE app_news_opt_in)::text || ' of ' || count(*)::text
FROM new_members

UNION ALL
SELECT '4 waitlist', 'waitlist emails still waiting on confirmation', count(*)::text
FROM public.waitlist WHERE confirmed_at IS NULL AND unsubscribed_at IS NULL

-- Only confirmed waitlist emails count: an unconfirmed one may not belong to
-- whoever typed it. Opted-in accounts confirmed their email to sign in.
UNION ALL
SELECT '4 waitlist', 'total reachable (confirmed waitlist + opted-in accounts, deduplicated)',
       count(*)::text
FROM (
  SELECT email FROM public.waitlist
  WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL
  UNION
  SELECT lower(u.email)
  FROM public.profiles p JOIN auth.users u ON u.id = p.id
  WHERE p.app_news_opt_in AND u.email IS NOT NULL
) reachable

-- ── Free limit: who hit it, and what they did next ──────────────────────────
UNION ALL
SELECT '5 free limit', 'refused adds this week', count(*)::text
FROM public.shelf_limit_hits h, params
WHERE h.created_at >= params.week_start AND h.created_at < params.week_end

UNION ALL
SELECT '5 free limit', 'members who hit it', count(*)::text
FROM limit_hits

UNION ALL
SELECT '5 free limit', '… then upgraded (have Premium now)', count(*)::text
FROM limit_hits l JOIN premium_members pm USING (user_id)

UNION ALL
SELECT '5 free limit', '… then made room (now under the limit, no Premium)',
       count(*)::text
FROM limit_hits l
WHERE l.user_id NOT IN (SELECT user_id FROM premium_members)
  AND (SELECT count(*) FROM public.watchlist_items w WHERE w.user_id = l.user_id) < 25

UNION ALL
SELECT '5 free limit', '… then went quiet (no activity since their first hit)',
       count(*)::text
FROM limit_hits l
WHERE NOT EXISTS (
  SELECT 1 FROM public.watchlist_items w
  WHERE w.user_id = l.user_id AND greatest(w.added_at, w.updated_at) > l.first_hit
)
AND NOT EXISTS (
  SELECT 1 FROM public.episode_watches e
  WHERE e.user_id = l.user_id AND e.watched_at > l.first_hit
)

-- ── Pay (from launch) ────────────────────────────────────────────────────────
UNION ALL
SELECT '6 pay', 'new Premium subscriptions: ' || s.platform, count(*)::text
FROM public.subscriptions s, params
WHERE s.created_at >= params.week_start AND s.created_at < params.week_end
  AND s.platform <> 'test'
GROUP BY s.platform

ORDER BY section, metric;
