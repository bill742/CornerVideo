import { ViewTransition } from "react";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Calendar, Star, Tv } from "lucide-react";

import { CastAndCrewInfo } from "@/components/movies/cast-and-crew-info";
import { TrailerButton } from "@/components/movies/trailer-button";
import { Badge } from "@/components/ui/badge";
import { AddToWatchlistButton } from "@/components/watchlist/add-button";

import { getTVCastAndCrew, getTVShow, getTVTrailer } from "@/data/tv-loaders";
import type { Genre } from "@/types";

/** See the notes on the movie detail page — same reasoning for both exports. */
export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const show = await getTVShow(id);
  if (!show) return { title: "Show Not Found" };
  return {
    alternates: { canonical: `/tv/${id}` },
    description: show.overview,
    title: `${show.name} (${show.first_air_date ? new Date(show.first_air_date).getFullYear() : "TBA"})`,
  };
}

export default async function TVShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [show, credits, trailerKey] = await Promise.all([
    getTVShow(id),
    getTVCastAndCrew(id),
    getTVTrailer(id),
  ]);

  if (!show) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Show not found.</p>
      </div>
    );
  }

  const cast = credits?.cast.slice(0, 12) ?? [];
  const seasons = show.seasons.filter((s) => s.season_number > 0);

  return (
    <ViewTransition default="none" enter="slide-up">
      <div className="min-h-screen pb-12">
        {/* Backdrop */}
        <div className="relative h-[60vh] w-full">
          {show.backdrop_path && (
            <>
              <Image
                src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}original${show.backdrop_path}`}
                alt={show.name}
                fill
                // Spans the layout's content column, which caps at max-w-7xl
                // less its px-8 gutters.
                sizes="(min-width: 1280px) 1216px, 100vw"
                className="object-cover"
                priority
              />
              <div className="from-background via-background/80 to-background/20 absolute inset-0 bg-linear-to-t" />
            </>
          )}
        </div>

        {/* Content */}
        <div className="relative container -mt-48 space-y-8">
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Poster */}
            <div className="shrink-0">
              <div className="relative h-112.5 w-75 overflow-hidden rounded-sm shadow-2xl">
                {show.poster_path ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w500${show.poster_path}`}
                    alt={show.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 300px) 100vw, 300px"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center text-center">
                    <span className="text-muted-foreground px-4 text-sm">
                      No Image Available
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="font-display text-4xl font-semibold tracking-wide md:text-5xl">
                  {show.name}
                </h1>
                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4">
                  {show.first_air_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(show.first_air_date).getFullYear()}</span>
                    </div>
                  )}
                  {show.vote_average && show.vote_average > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Star className="fill-highlight text-highlight h-4 w-4" />
                      <span className="text-foreground font-semibold">
                        {show.vote_average.toFixed(1)}
                      </span>
                      {show.vote_count && (
                        <span className="text-sm">
                          ({show.vote_count.toLocaleString()} votes)
                        </span>
                      )}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    <Tv className="h-4 w-4" />
                    <span>
                      {show.number_of_seasons} season
                      {show.number_of_seasons !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Badge variant="outline">{show.status}</Badge>
                </div>
              </div>

              {show.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {show.genres.map((genre: Genre) => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              {show.overview && (
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Overview</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {show.overview}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {trailerKey && (
                  <TrailerButton
                    movieTitle={show.name}
                    trailerKey={trailerKey}
                  />
                )}
                <AddToWatchlistButton mediaType="tv" tmdbId={show.id} />
              </div>

              {/* Seasons grid */}
              {seasons.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">Seasons</h2>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {seasons.map((season) => (
                      <Link
                        key={season.id}
                        href={`/tv/${show.id}/season/${season.season_number}`}
                        className="group space-y-1"
                      >
                        <div className="bg-muted relative aspect-2/3 overflow-hidden rounded-sm">
                          {season.poster_path ? (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w185${season.poster_path}`}
                              alt={season.name}
                              fill
                              // Tracks the grid: 3 columns, then 4 at sm, 5 at md.
                              sizes="(min-width: 1280px) 240px, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 33vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Tv className="text-muted-foreground h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <p className="truncate text-xs font-medium group-hover:underline">
                          {season.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {season.episode_count} ep.
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cast */}
          {cast.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Top Cast</h2>
              <div className="flex flex-wrap gap-4">
                {cast.map((person) => (
                  <div key={person.id} className="w-32">
                    <CastAndCrewInfo
                      id={person.id}
                      name={person.name}
                      profile_path={person.profile_path}
                      character={person.character}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ViewTransition>
  );
}
