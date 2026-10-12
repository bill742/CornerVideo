"use client";

import { useTransition } from "react";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { removeFromWatchlist } from "@/lib/actions/watchlist";
import type { MediaType } from "@/types";

interface Props {
  mediaType: MediaType;
  /** Title of the row this belongs to, so each button is distinguishable. */
  title: string;
  tmdbId: number;
}

function RemoveFromWatchlistButton({ mediaType, title, tmdbId }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      aria-label={`Remove ${title} from shelf`}
      disabled={pending}
      onClick={() =>
        startTransition(() => removeFromWatchlist(tmdbId, mediaType))
      }
      size="icon"
      variant="ghost"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}

RemoveFromWatchlistButton.displayName = "RemoveFromWatchlistButton";

export { RemoveFromWatchlistButton };
