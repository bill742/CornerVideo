"use client";

import { ViewTransition, startTransition, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { MediaList, ShelfHeading } from "@/components/media/media-list";
import { SkeletonCardList } from "@/components/skeletons/skeleton-card-list";

import { getSearchResults } from "@/data/client-loaders";
import type { MediaCardItem, MultiSearchItem } from "@/types";

/** /search/multi carries title/release_date for film and name/first_air_date for TV. */
function toMediaCardItem(item: MultiSearchItem): MediaCardItem {
  return {
    date: item.release_date ?? item.first_air_date ?? null,
    id: item.id,
    media_type: item.media_type,
    poster_path: item.poster_path,
    title: item.title ?? item.name ?? "Untitled",
    vote_average: item.vote_average,
  };
}

function ClientSearch() {
  const searchParams = useSearchParams();
  const term = searchParams.get("term");
  // null means "still loading" — the loaders swallow their own errors and
  // resolve to null, so a failed search is just an empty result set.
  const [searchResults, setSearchResults] = useState<MediaCardItem[] | null>(
    null
  );

  useEffect(() => {
    setSearchResults(null);

    getSearchResults(term || "").then((results) =>
      startTransition(() =>
        setSearchResults((results ?? []).map(toMediaCardItem))
      )
    );
  }, [term]);

  if (searchResults === null) {
    return (
      <ViewTransition key="skeleton" default="none" exit="slide-down">
        {/* The heading only needs the term, so it renders while results
            load: the page always has its <h1>, and nothing shifts when
            the cards arrive. */}
        <div className="space-y-6 py-8">
          <SkeletonCardList
            heading={
              <ShelfHeading level={1}>
                Results for &quot;{term}&quot;
              </ShelfHeading>
            }
          />
        </div>
      </ViewTransition>
    );
  }

  return (
    <ViewTransition enter="slide-up" default="none" key="content">
      <div className="space-y-12 py-8">
        <MediaList
          heading={`Results for "${term}"`}
          headingLevel={1}
          items={searchResults}
        />
      </div>
    </ViewTransition>
  );
}

ClientSearch.displayName = "ClientSearch";

export { ClientSearch };
