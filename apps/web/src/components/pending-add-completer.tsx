"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CircleAlert, CircleCheck, X } from "lucide-react";

import { addToWatchlist } from "@/lib/actions/watchlist";
import {
  SHELF_CHANGED_EVENT,
  clearPendingAdd,
  readPendingAdd,
  titlePath,
} from "@/lib/pending-add";
import { createClient } from "@/lib/supabase/client";

const VISIBLE_MS = 10_000;

interface Result {
  error: string | null;
  href: string;
}

/**
 * Finishes an Add to shelf that a visitor started while signed out (see
 * lib/pending-add.ts). It lives in the root layout, so it works wherever
 * sign-in lands: the title page itself, /movies, or anywhere else.
 *
 * The pending add is cleared before the add is tried, success or not, so a
 * full shelf or an error is reported once rather than on every page.
 */
function PendingAddCompleter() {
  const pathname = usePathname();
  const [result, setResult] = useState<Result | null>(null);
  const running = useRef(false);
  const complete = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;

    complete.current = async () => {
      if (running.current) return;
      const pending = readPendingAdd();
      if (!pending) return;

      running.current = true;
      try {
        // getSession reads the local cookie with no network call, so a
        // signed-out visitor browsing with a pending add costs nothing. The
        // server action checks the session properly.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        clearPendingAdd();
        const { error } = await addToWatchlist(
          pending.tmdbId,
          pending.mediaType
        );
        window.dispatchEvent(new Event(SHELF_CHANGED_EVENT));
        setResult({
          error,
          href: titlePath(pending.mediaType, pending.tmdbId),
        });
        clearTimeout(timer);
        timer = setTimeout(() => setResult(null), VISIBLE_MS);
      } finally {
        running.current = false;
      }
    };

    // Google and Apple sign-ins arrive as a browser auth event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") complete.current();
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  // Email sign-in is a server action that redirects, so the browser client
  // hears no auth event; checking on every navigation covers it. With nothing
  // pending this is one localStorage read.
  useEffect(() => {
    complete.current();
  }, [pathname]);

  const onTitlePage = result?.href === pathname;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      role="status"
    >
      {result && (
        <div className="bg-background text-foreground border-border pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg">
          {result.error ? (
            <CircleAlert
              aria-hidden="true"
              className="text-destructive mt-0.5 size-5 shrink-0"
            />
          ) : (
            <CircleCheck
              aria-hidden="true"
              className="text-new-release mt-0.5 size-5 shrink-0"
            />
          )}
          <div className="space-y-1 text-sm">
            <p className="font-semibold">
              {result.error
                ? "We couldn’t add that title."
                : "Added to your shelf."}
            </p>
            {result.error && (
              <p className="text-muted-foreground">{result.error}</p>
            )}
            {!onTitlePage && (
              <Link className="font-semibold underline" href={result.href}>
                Go to the title
              </Link>
            )}
          </div>
          <button
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-2 rounded p-1"
            onClick={() => setResult(null)}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      )}
    </div>
  );
}
PendingAddCompleter.displayName = "PendingAddCompleter";

export { PendingAddCompleter };
