"use client";

import { useOptimistic, useTransition } from "react";

import Image from "next/image";

import { CheckCircle2, Circle, Clock } from "lucide-react";

import {
  markEpisodeWatched,
  unmarkEpisodeWatched,
} from "@/lib/actions/episodes";
import { parseDate } from "@/lib/utils";
import type { TVEpisode } from "@/types";

interface EpisodeListProps {
  episodes: TVEpisode[];
  isLoggedIn: boolean;
  seasonNumber: number;
  showTmdbId: number;
  watchedEpisodes: number[];
}

function EpisodeList({
  episodes,
  isLoggedIn,
  seasonNumber,
  showTmdbId,
  watchedEpisodes,
}: EpisodeListProps) {
  const [optimisticWatched, addOptimistic] = useOptimistic(
    new Set(watchedEpisodes),
    (state, episodeNumber: number) => {
      const next = new Set(state);
      if (next.has(episodeNumber)) {
        next.delete(episodeNumber);
      } else {
        next.add(episodeNumber);
      }
      return next;
    }
  );
  const [, startTransition] = useTransition();

  const toggle = (episodeNumber: number) => {
    if (!isLoggedIn) return;
    const isWatched = optimisticWatched.has(episodeNumber);
    startTransition(async () => {
      addOptimistic(episodeNumber);
      if (isWatched) {
        await unmarkEpisodeWatched(showTmdbId, seasonNumber, episodeNumber);
      } else {
        await markEpisodeWatched(showTmdbId, seasonNumber, episodeNumber);
      }
    });
  };

  return (
    <div className="divide-border divide-y">
      {episodes.map((episode) => {
        const watched = optimisticWatched.has(episode.episode_number);
        return (
          <div
            key={episode.id}
            className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
          >
            {/* Still / placeholder */}
            <div className="bg-muted relative h-18 w-32 shrink-0 overflow-hidden rounded-md">
              {episode.still_path ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w300${episode.still_path}`}
                  alt={episode.name}
                  fill
                  // Fixed w-32 container at every breakpoint.
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Circle className="text-muted-foreground h-6 w-6" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-muted-foreground text-sm">
                    E{episode.episode_number}
                  </span>{" "}
                  <span className="font-medium">{episode.name}</span>
                  {watched && (
                    // The tape's been returned. Decorative: the button
                    // beside it already announces the watched state.
                    <span
                      aria-hidden
                      className="font-display border-new-release text-new-release ml-2 inline-block -rotate-6 rounded-sm border-2 px-1.5 text-xs font-semibold tracking-wider uppercase"
                    >
                      Returned
                    </span>
                  )}
                </div>
                {isLoggedIn && (
                  <button
                    onClick={() => toggle(episode.episode_number)}
                    aria-label={watched ? "Mark unwatched" : "Mark watched"}
                    className="shrink-0 transition-colors"
                  >
                    {watched ? (
                      <CheckCircle2 className="text-new-release h-5 w-5" />
                    ) : (
                      <Circle className="text-muted-foreground hover:text-foreground h-5 w-5" />
                    )}
                  </button>
                )}
              </div>

              <div className="text-muted-foreground flex items-center gap-3 text-xs">
                {episode.air_date && (
                  <span>
                    {parseDate(episode.air_date).toLocaleDateString()}
                  </span>
                )}
                {episode.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {episode.runtime}m
                  </span>
                )}
              </div>

              {episode.overview && (
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {episode.overview}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

EpisodeList.displayName = "EpisodeList";

export { EpisodeList };
