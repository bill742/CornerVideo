-- ─── Free shelf limit, enforced by the database ──────────────────────────────
-- Both apps check FREE_WATCHLIST_LIMIT before adding a title, but those checks
-- run as the member (web server action) or on the member's device (mobile).
-- Anyone with their own session could insert into watchlist_items directly
-- through the Supabase API and skip them. This trigger makes the database the
-- authority; the app checks stay so members get a friendly message first.
--
-- Premium here must match hasPremium() in packages/shared/src/premium.ts: any
-- subscription row that is 'active' or 'trialing' and not past its period end.
-- The limit (25) must match FREE_WATCHLIST_LIMIT in packages/shared/src/types.ts.

CREATE OR REPLACE FUNCTION public.enforce_watchlist_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  free_limit CONSTANT integer := 25;
  item_count integer;
BEGIN
  -- An upsert of a title already on the shelf fires this trigger too, before
  -- Postgres discovers the conflict and turns it into an update. It doesn't
  -- add a row, so it's always allowed.
  IF EXISTS (
    SELECT 1 FROM public.watchlist_items
    WHERE user_id = NEW.user_id
      AND tmdb_id = NEW.tmdb_id
      AND media_type = NEW.media_type
  ) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = NEW.user_id
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  ) THEN
    RETURN NEW;
  END IF;

  -- Serialise this member's inserts so two concurrent adds at 24 titles can't
  -- both see room and end on 26. The lock lasts until the transaction ends.
  PERFORM pg_advisory_xact_lock(hashtextextended('watchlist:' || NEW.user_id::text, 0));

  SELECT count(*) INTO item_count
  FROM public.watchlist_items
  WHERE user_id = NEW.user_id;

  IF item_count >= free_limit THEN
    -- The apps match on this message to show their own limit copy.
    RAISE EXCEPTION 'watchlist_limit_reached'
      USING ERRCODE = 'P0001',
            DETAIL = format('Free accounts can keep %s titles.', free_limit);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_watchlist_limit
  BEFORE INSERT ON public.watchlist_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_watchlist_limit();
