"use client";

import { ViewTransition, startTransition, useEffect, useState } from "react";

import { VhsLoader } from "@/components/brand/vhs-loader";
import { HeroBanner } from "@/components/hero/hero-banner";

import {
  getOnTheAirTV,
  getTVShow,
  getTVTrailer,
  getTrendingTV,
} from "@/data/client-loaders";
import { useRegion } from "@/lib/region-context";
import type { FeaturedItem, TVShow } from "@/types";

import { TVShowList } from "./tv-show-list";

function TVFetcher() {
  const { region } = useRegion();
  const [featured, setFeatured] = useState<{
    item: FeaturedItem;
    trailerKey: string | null;
  } | null>(null);
  const [trendingShows, setTrendingShows] = useState<TVShow[]>([]);
  const [onTheAirShows, setOnTheAirShows] = useState<TVShow[]>([]);
  // The region the current rows were fetched for; a region change reads as
  // loading until that region's rows land.
  const [loadedRegion, setLoadedRegion] = useState<string | null>(null);
  const loading = loadedRegion !== region;

  useEffect(() => {
    let ignore = false;

    const fetchShows = async () => {
      try {
        const [trendingData, onTheAirData] = await Promise.all([
          getTrendingTV(),
          getOnTheAirTV(region),
        ]);

        let featuredResult: typeof featured = null;
        if (trendingData && trendingData.length > 0) {
          const featuredShow = trendingData[0];
          const fullShow = await getTVShow(String(featuredShow.id));
          const show = fullShow ?? featuredShow;
          const trailerKey = await getTVTrailer(String(show.id));
          featuredResult = {
            item: {
              backdrop_path: show.backdrop_path,
              id: show.id,
              media_type: "tv",
              overview: show.overview,
              title: show.name,
            },
            trailerKey,
          };
        }

        if (ignore) return;
        startTransition(() => {
          setFeatured(featuredResult);
          setTrendingShows((trendingData ?? []).slice(0, 12));
          setOnTheAirShows((onTheAirData ?? []).slice(0, 12));
          setLoadedRegion(region);
        });
      } catch {
        if (ignore) return;
        startTransition(() => {
          setFeatured(null);
          setTrendingShows([]);
          setOnTheAirShows([]);
          setLoadedRegion(region);
        });
      }
    };

    fetchShows();

    return () => {
      ignore = true;
    };
  }, [region]);

  if (loading) {
    return (
      <ViewTransition key="tv-loading" default="none" exit="fade-out">
        <VhsLoader />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition key="tv-content" default="none" enter="fade-in">
      <div className="space-y-16">
        {featured && (
          <HeroBanner item={featured.item} trailerKey={featured.trailerKey} />
        )}
        <TVShowList shows={trendingShows} heading="Trending This Week" />
        <TVShowList shows={onTheAirShows} heading="Currently Airing" />
      </div>
    </ViewTransition>
  );
}

TVFetcher.displayName = "TVFetcher";

export { TVFetcher };
