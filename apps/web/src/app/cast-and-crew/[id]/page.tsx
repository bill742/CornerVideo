import { ViewTransition } from "react";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { FilmographyTabs } from "@/components/media/filmography-tabs";
import { MediaList } from "@/components/media/media-list";

import {
  getPerson,
  getPersonMovieCredits,
  getPersonTVCredits,
} from "@/data/loaders";
import {
  type Filmography,
  type MediaCardItem,
  defaultFilmographyTab,
  filmographySize,
  movieFilmography,
  tvFilmography,
} from "@/types";

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

/**
 * Most titles shown per filmography section — three full shelves at desktop
 * width. Every card is server-rendered, and a prolific crew member (one
 * documentary producer has 500+ credits) rendered them all, which blew the
 * Worker's CPU limit and failed the page with `exceededCpu`. Capping keeps the
 * render cost flat no matter how long the career.
 */
const SECTION_LIMIT = 18;

function FilmographySection({
  heading,
  items,
}: {
  heading: string;
  items: MediaCardItem[];
}) {
  return (
    <div className="space-y-3">
      <MediaList heading={heading} items={items.slice(0, SECTION_LIMIT)} />
      {items.length > SECTION_LIMIT && (
        <p className="text-muted-foreground text-sm">
          Showing the {SECTION_LIMIT} most recent of {items.length}.
        </p>
      )}
    </div>
  );
}

FilmographySection.displayName = "FilmographySection";

/** Every section for one media type. */
function FilmographySections({ acting, crew }: Filmography) {
  return (
    <div className="space-y-12">
      {acting.length > 0 && (
        <FilmographySection heading="Acting" items={acting} />
      )}
      {crew.map(([department, items]) => (
        <FilmographySection
          key={department}
          heading={department}
          items={items}
        />
      ))}
    </div>
  );
}

FilmographySections.displayName = "FilmographySections";

const EMPTY_FILMOGRAPHY: Filmography = { acting: [], crew: [] };

const SinglePerson = async ({ params }: PageProps) => {
  const { id } = await params;

  const [person, movieCredits, tvCredits] = await Promise.all([
    getPerson(id),
    getPersonMovieCredits(id),
    getPersonTVCredits(id),
  ]);

  if (!person) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">Person not found</h1>
        <p>The requested person could not be found or failed to load.</p>
      </div>
    );
  }

  const movies = movieCredits
    ? movieFilmography(movieCredits)
    : EMPTY_FILMOGRAPHY;
  const tv = tvCredits ? tvFilmography(tvCredits) : EMPTY_FILMOGRAPHY;

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

        <FilmographyTabs
          defaultTab={defaultFilmographyTab(movies, tv)}
          movies={
            filmographySize(movies) > 0 ? (
              <FilmographySections {...movies} />
            ) : null
          }
          tv={filmographySize(tv) > 0 ? <FilmographySections {...tv} /> : null}
        />
      </div>
    </ViewTransition>
  );
};

export default SinglePerson;
