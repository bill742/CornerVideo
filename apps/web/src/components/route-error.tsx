"use client";

import { startTransition, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface RouteErrorProps {
  error: Error & { digest?: string };
  /** What failed to load, in the user's words: "this movie", "this show". */
  noun: string;
  reset: () => void;
}

/**
 * The body of every route's error.tsx: says what didn't load and offers a
 * retry, inside the normal header and footer rather than a bare 500.
 *
 * Copy stays plain per the brand guide — no video-store jokes in errors.
 */
function RouteError({ error, noun, reset }: RouteErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // The digest matches the server log entry for the same failure.
    console.error(error);
  }, [error]);

  function retry() {
    // reset() alone re-renders the boundary with the same failed server
    // payload; refreshing first fetches a new one.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        We couldn&apos;t load {noun}
      </h1>
      <p className="text-muted-foreground max-w-md">
        Something went wrong on our end. Try again in a moment.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={retry}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go to Browse</Link>
        </Button>
      </div>
      {error.digest && (
        <p className="text-muted-foreground text-xs">
          Error reference: {error.digest}
        </p>
      )}
    </div>
  );
}

RouteError.displayName = "RouteError";

export { RouteError };
