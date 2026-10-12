import { memo } from "react";

import type { MediaCardItem } from "@/types";

import { MediaCard } from "./media-card";

interface ShelfHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2;
}

/** The sign over a run of shelves. Shared with the loading skeletons. */
function ShelfHeading({ children, level = 2 }: ShelfHeadingProps) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <Heading className="font-display border-primary border-l-4 pl-3 text-3xl leading-none font-semibold tracking-wide">
      {children}
    </Heading>
  );
}

ShelfHeading.displayName = "ShelfHeading";

interface MediaListProps {
  emptyMessage?: string;
  heading: string;
  /** 1 when the list is the page's subject, as on search results. */
  headingLevel?: 1 | 2;
  items: MediaCardItem[];
}

/**
 * The one card grid — a run of shelves. Takes already-normalized items so it
 * can render movies, TV, or a mix of both; MovieList and TVShowList are thin
 * wrappers over it.
 */
const MediaList = memo(
  ({
    emptyMessage = "No results found",
    heading,
    headingLevel = 2,
    items,
  }: MediaListProps) => {
    return (
      <section className="space-y-6">
        <ShelfHeading level={headingLevel}>{heading}</ShelfHeading>

        {items.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-sm border-2 border-dashed">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          // --shelf-gap must match gap-x so each card's stretch of shelf
          // meets its neighbour's.
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 [--shelf-gap:1rem] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
              // Ids are only unique within a media type, so a film and a show
              // can collide in a mixed list.
              <MediaCard
                item={item}
                key={`${item.media_type}-${item.id}`}
                titleLevel={headingLevel === 1 ? 2 : 3}
              />
            ))}
          </div>
        )}
      </section>
    );
  }
);

MediaList.displayName = "MediaList";

export { MediaList, ShelfHeading };
