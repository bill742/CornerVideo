"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { BookMarked, BookPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist";
import { createClient } from "@/lib/supabase/client";
import type { MediaType } from "@/types";

interface Props {
  mediaType: MediaType;
  tmdbId: number;
}

/**
 * Resolves its own auth and watchlist state in the browser.
 *
 * The detail pages used to pass `isLoggedIn`/`existingItem` down from a server
 * `auth.getUser()` call. That cookie read made every movie and TV page dynamic,
 * so a page whose content is identical for everyone still cost a function
 * invocation per view. Reading it here keeps the surrounding page static.
 */
function AddToWatchlistButton({ mediaType, tmdbId }: Props) {
  const [pending, startTransition] = useTransition();
  // `undefined` while loading, `null` when signed out. Nothing renders until
  // both sign-in and shelf state are known: showing "Add to shelf" while the
  // lookup was still in flight meant a quick click could land just after the
  // label flipped to "Remove from shelf" and take the title off instead.
  //
  // The button owns this state rather than waiting for the server: a refetch
  // of the page comes back with the pre-click markup, so relying on it made
  // the click look like it did nothing until a manual reload.
  const [onShelf, setOnShelf] = useState<boolean | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const resync = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    // Only the newest lookup may write state, so a slow earlier one can't
    // overwrite a newer answer.
    let latest = 0;

    async function sync() {
      const run = ++latest;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || run !== latest) return;

      if (!user) {
        setOnShelf(null);
        return;
      }

      // RLS already scopes to the caller; the explicit user_id filter keeps the
      // index lookup narrow. maybeSingle avoids the error .single() throws when
      // the item simply isn't on the list yet.
      const { data, error: lookupError } = await supabase
        .from("watchlist_items")
        .select("status")
        .eq("user_id", user.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType)
        .maybeSingle();

      if (!active || run !== latest || lookupError) return;
      setOnShelf(!!data);
    }

    resync.current = sync;
    sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // The initial session is the one sync() just read on mount; reading it
      // again only started a second lookup racing the first.
      if (event === "INITIAL_SESSION") return;
      sync();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [mediaType, tmdbId]);

  if (onShelf === undefined || onShelf === null) {
    return null;
  }

  const handleClick = () => {
    startTransition(async () => {
      setError(null);
      try {
        if (onShelf) {
          await removeFromWatchlist(tmdbId, mediaType);
          setOnShelf(false);
        } else {
          const { error: addError } = await addToWatchlist(tmdbId, mediaType);
          if (addError) throw new Error(addError);
          setOnShelf(true);
        }
      } catch (actionError) {
        // Say why (e.g. the free-tier limit) and re-read the real state, so
        // the label never claims a change that didn't happen.
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Could not update your shelf. Try again."
        );
        await resync.current();
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* No aria-label: the accessible name is the visible text, so
          voice-control users can say exactly what they see (WCAG 2.5.3). */}
      <Button
        disabled={pending}
        onClick={handleClick}
        // Matches TrailerButton, which sits beside this on both detail pages
        // and defaults to lg. At sm this rendered 32px against its 40px.
        size="lg"
        variant={onShelf ? "default" : "outline"}
      >
        {onShelf ? (
          <BookMarked className="mr-1.5 h-4 w-4" />
        ) : (
          <BookPlus className="mr-1.5 h-4 w-4" />
        )}
        {onShelf ? "Remove from shelf" : "Add to shelf"}
      </Button>
      {error && (
        <p className="text-destructive max-w-xs text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

AddToWatchlistButton.displayName = "AddToWatchlistButton";

export { AddToWatchlistButton };
