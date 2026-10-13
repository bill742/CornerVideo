"use client";

import { ViewTransition, startTransition, useEffect, useState } from "react";

import { VhsLoader } from "@/components/brand/vhs-loader";
import { HeroBanner } from "@/components/hero/hero-banner";

import {
  getMovie,
  getMovieTrailer,
  getReleaseRows,
  getTrendingMovies,
  getUpcomingMovies,
} from "@/data/client-loaders";
import { useRegion } from "@/lib/region-context";
import type { FeaturedItem, Movie } from "@/types";

import { MovieList } from "./movie-list";

function MovieFetcher() {
  const { region } = useRegion();
  const [featured, setFeatured] = useState<{
    item: FeaturedItem;
    trailerKey: string | null;
  } | null>(null);
  const [inTheaters, setInTheaters] = useState<Movie[]>([]);
  const [newOnDigital, setNewOnDigital] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  // The region the current rows were fetched for; a region change reads as
  // loading until that region's rows land.
  const [loadedRegion, setLoadedRegion] = useState<string | null>(null);
  const loading = loadedRegion !== region;

  useEffect(() => {
    let ignore = false;

    const fetchMovies = async () => {
      try {
        const [trendingData, releaseRows, upcomingData] = await Promise.all([
          getTrendingMovies(),
          getReleaseRows(region),
          getUpcomingMovies(region),
        ]);

        if (!releaseRows) throw new Error("Failed to fetch releases");
        if (!upcomingData) throw new Error("Failed to fetch upcoming movies");

        let featuredResult: typeof featured = null;
        if (trendingData && trendingData.length > 0) {
          const featuredMovie = trendingData[0];
          // Fetch the full movie record for overview (trending endpoint may omit it)
          const fullMovie = await getMovie(String(featuredMovie.id));
          const movie = fullMovie ?? featuredMovie;
          const trailerKey = await getMovieTrailer(String(movie.id));
          featuredResult = {
            item: {
              backdrop_path: movie.backdrop_path,
              id: movie.id,
              media_type: "movie",
              overview: movie.overview,
              title: movie.title,
            },
            trailerKey,
          };
        }

        if (ignore) return;
        startTransition(() => {
          setFeatured(featuredResult);
          setInTheaters(releaseRows.theatrical.slice(0, 12));
          setNewOnDigital(releaseRows.digital.slice(0, 12));
          setUpcomingMovies(upcomingData.slice(0, 12));
          setLoadedRegion(region);
        });
      } catch {
        if (ignore) return;
        startTransition(() => {
          setFeatured(null);
          setInTheaters([]);
          setNewOnDigital([]);
          setUpcomingMovies([]);
          setLoadedRegion(region);
        });
      }
    };

    fetchMovies();

    return () => {
      ignore = true;
    };
  }, [region]);

  if (loading) {
    return (
      <ViewTransition key="loading" default="none" exit="fade-out">
        <VhsLoader />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition key="content" default="none" enter="fade-in">
      <div className="space-y-16">
        {featured && (
          <HeroBanner item={featured.item} trailerKey={featured.trailerKey} />
        )}
        <MovieList movies={inTheaters} heading="In Theatres" />
        <MovieList movies={newOnDigital} heading="New on Digital" />
        <MovieList movies={upcomingMovies} heading="Coming Soon" />
      </div>
    </ViewTransition>
  );
}

MovieFetcher.displayName = "MovieFetcher";

export { MovieFetcher };
