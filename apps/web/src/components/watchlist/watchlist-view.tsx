"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Clapperboard, Tv } from "lucide-react";

import { TabButton } from "@/components/tab-button";

import {
  type MediaType,
  WATCH_STATUS_LABELS,
  WATCH_STATUS_OPTIONS,
  type WatchStatus,
} from "@/types";

import { RemoveFromWatchlistButton } from "./remove-button";
import { WatchStatusSelect } from "./watch-status-select";

/** A saved row with its TMDB details already resolved by the server. */
export interface WatchlistEntry {
  date: string | null;
  href: string;
  id: string;
  mediaType: MediaType;
  posterPath: string | null;
  status: WatchStatus;
  title: string;
  tmdbId: number;
}

type StatusFilter = WatchStatus | "all";

const MEDIA_TABS: { icon: React.ReactNode; label: string; value: MediaType }[] =
  [
    {
      icon: <Clapperboard className="h-4 w-4" />,
      label: "Movies",
      value: "movie",
    },
    { icon: <Tv className="h-4 w-4" />, label: "TV Shows", value: "tv" },
  ];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  ...WATCH_STATUS_OPTIONS.map((status) => ({
    label: WATCH_STATUS_LABELS[status],
    value: status as StatusFilter,
  })),
];

interface Props {
  entries: WatchlistEntry[];
}

/**
 * Watchlist list with the same media tabs and status filters as the mobile
 * app. Filtering happens here rather than through the URL because the server
 * resolves every row against TMDB — re-running that on each filter change
 * would mean a fresh set of API calls just to hide some rows.
 */
function WatchlistView({ entries }: Props) {
  const [mediaTab, setMediaTab] = useState<MediaType>("movie");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const mediaEntries = useMemo(
    () => entries.filter((entry) => entry.mediaType === mediaTab),
    [entries, mediaTab]
  );

  const visible = useMemo(
    () =>
      statusFilter === "all"
        ? mediaEntries
        : mediaEntries.filter((entry) => entry.status === statusFilter),
    [mediaEntries, statusFilter]
  );

  const noun = mediaTab === "tv" ? "shows" : "movies";

  return (
    <div className="space-y-6">
      <div className="bg-card flex w-fit gap-1 rounded-sm border p-1">
        {MEDIA_TABS.map((tab) => (
          <TabButton
            active={tab.value === mediaTab}
            icon={tab.icon}
            key={tab.value}
            label={tab.label}
            onClick={() => setMediaTab(tab.value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((filter) => (
          <TabButton
            active={filter.value === statusFilter}
            key={filter.value}
            label={filter.label}
            onClick={() => setStatusFilter(filter.value)}
          />
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        {visible.length} item{visible.length !== 1 ? "s" : ""}
      </p>

      {visible.length === 0 ? (
        <p className="text-muted-foreground py-8 text-sm">
          No {noun}
          {statusFilter === "all"
            ? " on your shelf yet."
            : ` marked "${WATCH_STATUS_LABELS[statusFilter]}".`}
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {visible.map((entry) => (
            <li className="flex items-center gap-4 py-4" key={entry.id}>
              {/* No prefetch: a full shelf prefetched every detail page at
                  once, and each uncached render overran the Workers free
                  plan's CPU limit. The detail pages' loading.tsx covers the
                  wait on click. */}
              <Link className="shrink-0" href={entry.href} prefetch={false}>
                {entry.posterPath ? (
                  <Image
                    alt={entry.title}
                    className="rounded-sm object-cover shadow-sm"
                    height={90}
                    src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w92${entry.posterPath}`}
                    width={60}
                  />
                ) : (
                  <div className="bg-muted h-[90px] w-[60px] rounded-sm">
                    <span className="sr-only">{entry.title}</span>
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={entry.href} prefetch={false}>
                  <p className="truncate font-semibold hover:underline">
                    {entry.title}
                  </p>
                </Link>
                {entry.date && (
                  <p className="text-muted-foreground text-sm">
                    {new Date(entry.date).getFullYear()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <WatchStatusSelect
                  currentStatus={entry.status}
                  mediaType={entry.mediaType}
                  title={entry.title}
                  tmdbId={entry.tmdbId}
                />
                <RemoveFromWatchlistButton
                  mediaType={entry.mediaType}
                  title={entry.title}
                  tmdbId={entry.tmdbId}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

WatchlistView.displayName = "WatchlistView";

export { WatchlistView };
