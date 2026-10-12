"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Info, Play } from "lucide-react";

import { TrailerModal } from "@/components/movies/trailer-modal";
import { Button } from "@/components/ui/button";

import type { FeaturedItem } from "@/types";

interface HeroBannerProps {
  item: FeaturedItem;
  trailerKey?: string | null;
}

function HeroBanner({ item, trailerKey }: HeroBannerProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const detailHref =
    item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;
  const label = item.media_type === "tv" ? "Featured show" : "Featured movie";

  return (
    <>
      <section className="relative h-125 w-full overflow-hidden rounded-sm">
        <div className="absolute inset-0">
          {item.backdrop_path && (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}original${item.backdrop_path}`}
              alt={item.title}
              fill
              // Spans the layout's content column, which caps at max-w-7xl
              // less its px-8 gutters.
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        </div>

        <div className="relative flex h-full items-end p-8 md:p-12">
          <div className="max-w-2xl space-y-4">
            <p className="bg-highlight text-highlight-foreground font-display inline-block -rotate-2 rounded-sm px-3 py-1 text-sm font-semibold tracking-wide">
              {label}
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-wide text-white md:text-6xl">
              {item.title}
            </h2>
            <p className="line-clamp-3 text-lg text-gray-200">
              {item.overview}
            </p>
            <div className="flex flex-wrap gap-3">
              {trailerKey && (
                <Button
                  className="gap-2"
                  size="lg"
                  onClick={() => setShowTrailer(true)}
                >
                  <Play className="h-5 w-5 fill-white" />
                  Watch Trailer
                </Button>
              )}
              <Link href={detailHref}>
                <Button
                  className="gap-2 bg-white/90 text-black backdrop-blur-sm hover:bg-black hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  size="lg"
                  variant="outline"
                >
                  <Info className="h-5 w-5" />
                  More Info
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {trailerKey && (
        <TrailerModal
          movieTitle={item.title}
          onOpenChange={setShowTrailer}
          open={showTrailer}
          trailerKey={trailerKey}
        />
      )}
    </>
  );
}

HeroBanner.displayName = "HeroBanner";

export { HeroBanner };
