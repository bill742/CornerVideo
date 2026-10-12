import Image from "next/image";
import Link from "next/link";

import { Star } from "lucide-react";

import { RentalSticker } from "@/components/brand/rental-sticker";

import { parseDate } from "@/lib/utils";
import type { MediaCardItem } from "@/types";

const DAY_MS = 86_400_000;

/** How long after release a title still wears the "New" sticker. */
const NEW_FOR_DAYS = 14;

/**
 * The sticker on the tape: the release date while it's still to come, "New"
 * for a fortnight after, nothing once it has settled onto the shelf.
 */
function stickerFor(date: string | null) {
  if (!date) return null;

  const release = parseDate(date);
  const days = (release.getTime() - Date.now()) / DAY_MS;

  if (days > 0) {
    return (
      <>
        <span className="text-[0.6rem] uppercase">
          {release.toLocaleDateString("en-CA", { month: "short" })}
        </span>
        <span className="text-base">{release.getDate()}</span>
      </>
    );
  }

  if (days > -NEW_FOR_DAYS) return <span className="text-xs">New</span>;

  return null;
}

interface Props {
  item: MediaCardItem;
  /** One below the list heading, so the outline never skips a level. */
  titleLevel?: 2 | 3;
}

function MediaCard({ item, titleLevel = 3 }: Props) {
  const Title = titleLevel === 2 ? "h2" : "h3";
  const href =
    item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;
  const sticker = stickerFor(item.date);

  return (
    <Link className="group flex flex-col no-underline" href={href}>
      {/* The tape stands on the shelf; pb leaves room for the plank. */}
      <div className="shelf-slot relative pb-[5px]">
        <div className="bg-muted relative aspect-2/3 overflow-hidden rounded-sm shadow-md transition-transform duration-200 group-hover:-translate-y-2 group-focus-visible:-translate-y-2 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
          {item.poster_path ? (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 15vw"
              src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w342${item.poster_path}`}
            />
          ) : (
            <div className="border-border flex h-full w-full items-center justify-center border-x-8 px-3 text-center">
              <span className="font-display text-muted-foreground text-sm font-medium">
                {item.title}
              </span>
            </div>
          )}
        </div>

        {sticker && (
          <RentalSticker
            aria-hidden
            className="absolute top-1.5 -left-1.5 h-11 w-11 -rotate-12 flex-col"
          >
            {sticker}
          </RentalSticker>
        )}
      </div>

      <div className="mt-3 space-y-0.5">
        <Title className="line-clamp-2 leading-snug font-semibold group-hover:underline">
          {item.title}
        </Title>
        <p className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
          <span>
            {item.date
              ? parseDate(item.date).toLocaleDateString("en-CA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Date TBA"}
          </span>
          {item.vote_average ? (
            <span className="flex items-center gap-1">
              <Star
                aria-hidden
                className="fill-highlight text-highlight h-3.5 w-3.5"
              />
              <span className="sr-only">Rated</span>
              {item.vote_average.toFixed(1)}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}

MediaCard.displayName = "MediaCard";

export { MediaCard };
