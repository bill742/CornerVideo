-- ─── Launch measurement ──────────────────────────────────────────────────────
--
-- The storage behind the marketing plan's Measurement section and the app
-- waitlist (docs/launch-readiness-plan.md, PR 3):
--
--   • waitlist          — emails for app-launch news, with CASL consent
--   • profiles columns  — where a member came from, and app-news opt-in
--   • shelf_limit_hits  — each time a free member hits the 25-title cap
--
-- Every member table references auth.users ON DELETE CASCADE, so
-- delete-account removes these rows with the member. waitlist isn't keyed by
-- member; delete-account removes the row matching the member's email.

-- ─── Waitlist ────────────────────────────────────────────────────────────────

CREATE TABLE public.waitlist (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT        NOT NULL UNIQUE
                                CHECK (email = lower(email) AND length(email) <= 254),
  -- CASL needs proof of express consent: when, and the exact wording shown.
  consented_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_text      TEXT        NOT NULL CHECK (length(consent_text) BETWEEN 1 AND 500),
  -- Where on the site the form was (e.g. "home"), for comparing placements.
  source            TEXT        CHECK (length(source) <= 50),
  utm_source        TEXT        CHECK (length(utm_source) <= 100),
  utm_medium        TEXT        CHECK (length(utm_medium) <= 100),
  utm_campaign      TEXT        CHECK (length(utm_campaign) <= 100),
  -- For the one-click unsubscribe link every email must carry (CASL); used
  -- once the first email goes out.
  unsubscribe_token UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  unsubscribed_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS on with no policies: nobody reads or writes the table through the API.
-- The form writes through join_waitlist() below; reads are dashboard-only.
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Adds an email to the waitlist. Returns nothing, whether the email is new or
-- already listed, so the form can't be used to find out who has signed up.
-- An email already on the list keeps its original consent record; one that
-- had unsubscribed and signs up again is resubscribed with the new consent.
CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_email        TEXT,
  p_consent_text TEXT,
  p_source       TEXT DEFAULT NULL,
  p_utm_source   TEXT DEFAULT NULL,
  p_utm_medium   TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  clean_email TEXT := lower(btrim(p_email));
BEGIN
  -- Deliberately loose: one @, something either side, a dot in the domain.
  -- The real check is the confirmation email Phase 2 will send.
  IF clean_email IS NULL
     OR length(clean_email) > 254
     OR clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  IF p_consent_text IS NULL OR length(btrim(p_consent_text)) = 0 THEN
    RAISE EXCEPTION 'consent_required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.waitlist (
    email, consent_text, source, utm_source, utm_medium, utm_campaign
  )
  VALUES (
    clean_email,
    left(p_consent_text, 500),
    left(p_source, 50),
    left(p_utm_source, 100),
    left(p_utm_medium, 100),
    left(p_utm_campaign, 100)
  )
  ON CONFLICT (email) DO UPDATE
    SET consent_text    = excluded.consent_text,
        consented_at    = now(),
        unsubscribed_at = NULL
    WHERE public.waitlist.unsubscribed_at IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.join_waitlist(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_waitlist(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO anon, authenticated;

-- ─── Profile attribution ─────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN utm_source           TEXT CHECK (length(utm_source) <= 100),
  ADD COLUMN utm_medium           TEXT CHECK (length(utm_medium) <= 100),
  ADD COLUMN utm_campaign         TEXT CHECK (length(utm_campaign) <= 100),
  -- The optional "How did you hear about us?" answer on sign-up. Keep the
  -- list in step with HEARD_FROM_OPTIONS in packages/shared/src/attribution.ts.
  ADD COLUMN heard_from           TEXT
                                  CHECK (heard_from IN ('reddit', 'friend', 'press', 'search', 'other')),
  ADD COLUMN app_news_opt_in      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN app_news_opted_in_at TIMESTAMPTZ;

-- handle_new_user now also copies what the sign-up form sent in the user's
-- metadata (signUp's options.data). Every value is cleaned here rather than
-- trusted: anyone can call the Auth API with any metadata, and a CHECK
-- failure inside this trigger would make the sign-up itself fail.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  meta     JSONB   := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  heard    TEXT    := meta ->> 'heard_from';
  opted_in BOOLEAN := lower(coalesce(meta ->> 'app_news_opt_in', '')) = 'true';
BEGIN
  IF heard NOT IN ('reddit', 'friend', 'press', 'search', 'other') THEN
    heard := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, utm_source, utm_medium, utm_campaign, heard_from,
    app_news_opt_in, app_news_opted_in_at
  )
  VALUES (
    new.id,
    nullif(left(meta ->> 'utm_source', 100), ''),
    nullif(left(meta ->> 'utm_medium', 100), ''),
    nullif(left(meta ->> 'utm_campaign', 100), ''),
    heard,
    opted_in,
    CASE WHEN opted_in THEN now() END
  );
  RETURN new;
END;
$$;

-- ─── Shelf limit hits ────────────────────────────────────────────────────────

-- Logged by the apps when an add is refused for the free limit. The trigger
-- that enforces the limit (migration 003) can't log it itself: the exception
-- it raises rolls back its own transaction, log row included.
CREATE TABLE public.shelf_limit_hits (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tmdb_id    INTEGER     NOT NULL,
  media_type TEXT        NOT NULL CHECK (media_type IN ('movie', 'tv')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX shelf_limit_hits_user_created_idx
  ON public.shelf_limit_hits (user_id, created_at);

ALTER TABLE public.shelf_limit_hits ENABLE ROW LEVEL SECURITY;

-- Insert only, and only as yourself. No select/update/delete: the log is for
-- the weekly metrics query, read from the dashboard.
CREATE POLICY "Members log their own limit hits"
  ON public.shelf_limit_hits FOR INSERT
  WITH CHECK (auth.uid() = user_id);
