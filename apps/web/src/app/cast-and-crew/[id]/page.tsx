import { ViewTransition } from "react";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { MovieList } from "@/components/movies/movie-list";

import { getPerson, getPersonMovieCredits } from "@/data/loaders";
import type { Movie, PersonMovieCredit } from "@/types";

/** See the notes on the movie detail page — same reasoning for both exports. */
export const revalidate = 86400;

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

  const person = await getPerson(id);

  if (!person) {
    return {
      description: "The requested person could not be found.",
      title: "Person Not Found",
    };
  }

  return {
    alternates: {
      canonical: `/cast-and-crew/${id}`,
    },
    description: person.biography
      ? person.biography.slice(0, 160)
      : `${person.name} filmography and biography.`,
    title: person.name,
  };
}

function creditToMovie(credit: PersonMovieCredit): Movie {
  return {
    backdrop_path: credit.backdrop_path ?? "",
    genres: [],
    id: credit.id,
    overview: credit.overview,
    poster_path: credit.poster_path ?? "",
    release_date: credit.release_date,
    release_dates: [],
    runtime: 0,
    title: credit.title,
    vote_average: credit.vote_average,
    vote_count: credit.vote_count,
  };
}

function sortByReleaseDateDesc(
  credits: PersonMovieCredit[]
): PersonMovieCredit[] {
  return [...credits].sort((a, b) => {
    if (!a.release_date) return 1;
    if (!b.release_date) return -1;
    return (
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    );
  });
}

function deduplicateById(credits: PersonMovieCredit[]): PersonMovieCredit[] {
  const seen = new Set<number>();
  return credits.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

const DEPARTMENT_ORDER = [
  "Directing",
  "Writing",
  "Production",
  "Camera",
  "Editing",
  "Sound",
  "Music",
  "Art",
  "Costume & Make-Up",
  "Visual Effects",
  "Crew",
];

function groupCrewByDepartment(
  credits: PersonMovieCredit[]
): [string, Movie[]][] {
  const grouped: Record<string, PersonMovieCredit[]> = {};
  for (const credit of credits) {
    const dept = credit.department ?? "Crew";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(credit);
  }

  return Object.entries(grouped)
    .map(([dept, deptCredits]): [string, Movie[]] => [
      dept,
      sortByReleaseDateDesc(deduplicateById(deptCredits)).map(creditToMovie),
    ])
    .sort(([a], [b]) => {
      const ai = DEPARTMENT_ORDER.indexOf(a);
      const bi = DEPARTMENT_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
}

/**
 * Most titles shown per filmography section — three full shelves at desktop
 * width. Every card is server-rendered, and a prolific crew member (one
 * documentary producer has 500+ credits) rendered them all, which blew the
 * Worker's CPU limit and failed the page with `exceededCpu`. Capping keeps the
 * render cost flat no matter how long the career.
 */
const SECTION_LIMIT = 18;

function Filmography({
  heading,
  movies,
}: {
  heading: string;
  movies: Movie[];
}) {
  return (
    <div className="space-y-3">
      <MovieList heading={heading} movies={movies.slice(0, SECTION_LIMIT)} />
      {movies.length > SECTION_LIMIT && (
        <p className="text-muted-foreground text-sm">
          Showing the {SECTION_LIMIT} most recent of {movies.length}.
        </p>
      )}
    </div>
  );
}

Filmography.displayName = "Filmography";

const SinglePerson = async ({ params }: PageProps) => {
  const { id } = await params;

  const [person, credits] = await Promise.all([
    getPerson(id),
    getPersonMovieCredits(id),
  ]);

  if (!person) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">Person not found</h1>
        <p>The requested person could not be found or failed to load.</p>
      </div>
    );
  }

  // Deduplicated like the crew sections: TMDB can list one film twice for an
  // actor (two roles), which would otherwise repeat the card and its key.
  const castMovies = credits
    ? sortByReleaseDateDesc(deduplicateById(credits.cast)).map(creditToMovie)
    : [];

  const crewByDepartment = credits ? groupCrewByDepartment(credits.crew) : [];

  return (
    <ViewTransition default="none" enter="fade-in">
      <div className="container mx-auto space-y-12 py-8">
        {/* Person header */}
        <div className="flex flex-col gap-6 sm:flex-row">
          {person.profile_path ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w342${person.profile_path}`}
              alt={person.name}
              width={200}
              height={300}
              className="h-auto w-40 shrink-0 self-start rounded-sm object-cover shadow-md sm:w-48"
            />
          ) : (
            <div className="bg-muted flex h-72 w-40 shrink-0 items-center justify-center self-start rounded-sm text-center sm:w-48">
              <span className="text-muted-foreground px-4 text-sm">
                No Image Available
              </span>
            </div>
          )}

          <div className="space-y-3">
            <h1 className="font-display text-4xl font-semibold tracking-wide">
              {person.name}
            </h1>

            {person.imdb_id && (
              <Link
                href={`https://www.imdb.com/name/${person.imdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-block text-sm font-medium underline-offset-4 hover:underline"
              >
                View on IMDb
              </Link>
            )}

            {person.biography && (
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                {person.biography}
              </p>
            )}
          </div>
        </div>

        {/* Cast filmography */}
        {castMovies.length > 0 && (
          <Filmography heading="Acting" movies={castMovies} />
        )}

        {/* Crew filmography by department */}
        {crewByDepartment.map(([department, movies]) => (
          <Filmography key={department} heading={department} movies={movies} />
        ))}
      </div>
    </ViewTransition>
  );
};

export default SinglePerson;
