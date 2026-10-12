"use client";

import { useEffect, useState, useTransition } from "react";

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
  // `undefined` until resolved, so we render nothing rather than flashing
  // "Add to shelf" at a signed-out visitor.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | undefined>(undefined);
  // Own the state this button changes rather than waiting for the server.
  // Neither revalidatePath on this route nor router.refresh() relabels the
  // button: the refetch it triggers comes back with the pre-click markup, so
  // the click looked like it did nothing until a manual reload.
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function sync() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setIsLoggedIn(false);
        setIsInWatchlist(false);
        return;
      }

      setIsLoggedIn(true);

      // RLS already scopes to the caller; the explicit user_id filter keeps the
      // index lookup narrow. maybeSingle avoids the error .single() throws when
      // the item simply isn't on the list yet.
      const { data } = await supabase
        .from("watchlist_items")
        .select("status")
        .eq("user_id", user.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType)
        .maybeSingle();

      if (active) setIsInWatchlist(!!data);
    }

    sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      sync();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [mediaType, tmdbId]);

  if (!isLoggedIn) {
    return null;
  }

  const handleClick = () => {
    startTransition(async () => {
      if (isInWatchlist) {
        await removeFromWatchlist(tmdbId, mediaType);
        setIsInWatchlist(false);
      } else {
        await addToWatchlist(tmdbId, mediaType);
        setIsInWatchlist(true);
      }
    });
  };

  return (
    // No aria-label: the accessible name is the visible text, so voice-control
    // users can say exactly what they see (WCAG 2.5.3).
    <Button
      disabled={pending}
      onClick={handleClick}
      // Matches TrailerButton, which sits beside this on both detail pages and
      // defaults to lg. At sm this rendered 32px against its 40px.
      size="lg"
      variant={isInWatchlist ? "default" : "outline"}
    >
      {isInWatchlist ? (
        <BookMarked className="mr-1.5 h-4 w-4" />
      ) : (
        <BookPlus className="mr-1.5 h-4 w-4" />
      )}
      {isInWatchlist ? "Remove from shelf" : "Add to shelf"}
    </Button>
  );
}

AddToWatchlistButton.displayName = "AddToWatchlistButton";

export { AddToWatchlistButton };
