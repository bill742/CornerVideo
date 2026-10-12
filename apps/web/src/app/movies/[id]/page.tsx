import { ViewTransition } from "react";

import type { Metadata } from "next";
import Image from "next/image";

import { Calendar, Clock, Star } from "lucide-react";

import { CastAndCrewInfo } from "@/components/movies/cast-and-crew-info";
import { TrailerButton } from "@/components/movies/trailer-button";
import { Badge } from "@/components/ui/badge";
import { AddToWatchlistButton } from "@/components/watchlist/add-button";

import { getCastAndCrew, getMovie, getMovieTrailer } from "@/data/loaders";
import type { Genre } from "@/types";

/**
 * TMDB detail data changes rarely, and the page is now identical for every
 * visitor, so it can be served from the CDN instead of re-rendered per request.
 *
 * The effective TTL is the lower of this and the TMDB fetch revalidate in
 * utils/fetch-apis.ts, so in practice it is that hour, not a day. Past it the
 * cached copy is still served while it re-renders in the background, so a
 * stale entry costs a visitor nothing.
 */
export const revalidate = 86400;

/**
 * Empty on purpose: prerendering every TMDB id at build time is absurd, but
 * without this export the segment is treated as fully dynamic and `revalidate`
 * above is ignored — each visit re-renders and nothing is ever cached. Empty
 * defers rendering to the first request for a given id, then caches it.
 */
export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const movie = await getMovie(id);

  if (!movie) {
    return {
      description: "The requested movie could not be found.",
      title: "Movie Not Found",
    };
  }

  return {
    alternates: {
      canonical: `/movies/${id}`,
    },
    description:
      movie.overview ||
      `Watch ${movie.title} and discover more information about this film.`,
    title: `${movie.title} (${movie.release_date ? new Date(movie.release_date).getFullYear() : "TBA"})`,
  };
}

const SingleMovie = async ({ params }: PageProps) => {
  const { id } = await params;

  const movie = await getMovie(id);

  if (!movie) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">Movie not found</h1>
        <p>
          The requested movie could not be found or failed to load from the
          database.
        </p>
      </div>
    );
  }

  const castAndCrew = await getCastAndCrew(id);

  const directors = castAndCrew
    ? castAndCrew.crew.filter((member) => member.job === "Director")
    : [];

  // Check if trailer is available
  const trailerKey = await getMovieTrailer(id);

  return (
    <ViewTransition default="none" enter="fade-in">
      <div className="min-h-screen pb-12">
        {/* Backdrop with gradient */}
        <div className="relative h-[60vh] w-full">
          {movie.backdrop_path && (
            <>
              <Image
                src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}original${movie.backdrop_path}`}
                alt={movie.title}
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
                {movie.poster_path ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w500${movie.poster_path}`}
                    alt={movie.title}
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
                  {movie.title}
                </h1>

                {/* Meta info */}
                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4">
                  {movie.release_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                  )}
                  {movie.runtime && movie.runtime > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{movie.runtime} min</span>
                    </div>
                  ) : null}
                  {movie.vote_average && movie.vote_average > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Star className="fill-highlight text-highlight h-4 w-4" />
                      <span className="text-foreground font-semibold">
                        {movie.vote_average.toFixed(1)}
                      </span>
                      {movie.vote_count && (
                        <span className="text-sm">
                          ({movie.vote_count.toLocaleString()} votes)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4" />
                      <span className="text-foreground font-semibold">
                        Not rated yet
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre: Genre) => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              {movie.overview && (
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Overview</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {trailerKey && (
                  <TrailerButton
                    movieTitle={movie.title}
                    trailerKey={trailerKey}
                  />
                )}
                <AddToWatchlistButton mediaType="movie" tmdbId={movie.id} />
              </div>

              {castAndCrew && castAndCrew.cast.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    {directors.length > 0 ? "Directors" : "Director"}
                  </h2>

                  {directors.length === 0 && (
                    <p className="font-medium">
                      Director information not available
                    </p>
                  )}

                  <div className="flex flex-row gap-4">
                    {directors.length > 0 &&
                      directors.map((director) => (
                        <div key={director.id}>
                          <CastAndCrewInfo
                            profile_path={director.profile_path}
                            name={director.name}
                            id={director.id}
                            job={`director of ${movie.title}`}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {castAndCrew && castAndCrew.cast.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Top Cast</h2>
                  <div className="flex flex-wrap gap-4">
                    {castAndCrew.cast.map((castMember) => (
                      <div key={castMember.id} className="w-32">
                        <CastAndCrewInfo
                          profile_path={castMember.profile_path}
                          name={castMember.name}
                          id={castMember.id}
                          character={castMember.character}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
};

export default SingleMovie;
