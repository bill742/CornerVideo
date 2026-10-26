import { cache } from "react";

import "server-only";

import type {
  CastAndCrew,
  Movie,
  MultiSearchItem,
  Person,
  PersonMovieCredit,
} from "@/types";
import {
  fetchAPI,
  fetchAPIList,
  tmdbRequestOptions,
  tmdbUncachedRequestOptions,
} from "@/utils/fetch-apis";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Cached function to fetch movie data - automatically deduplicated by React
export const getMovie = cache(async (id: string): Promise<Movie | null> => {
  if (!BASE_URL) {
    console.error("NEXT_PUBLIC_API_URL is not defined");
    return null;
  }
  const url = `${BASE_URL}/movie/${id}?language=en-US`;

  const movie = await fetchAPI<Movie>(url);

  if (!movie) {
    console.error(`Failed to fetch movie with ID: ${id}`);
  }

  return movie;
});

/**
 * getMovie without Next's data cache, for My Shelf, which looks up every saved
 * title in one request. See tmdbUncachedRequestOptions for why.
 */
export const getShelfMovie = cache(
  async (id: string): Promise<Movie | null> => {
    if (!BASE_URL) return null;
    const movie = await fetchAPI<Movie>(
      `${BASE_URL}/movie/${id}?language=en-US`,
      tmdbUncachedRequestOptions()
    );

    if (!movie) {
      console.error(`Failed to fetch movie with ID: ${id}`);
    }

    return movie;
  }
);

export const getCastAndCrew = cache(
  async (
    id: string
  ): Promise<{ cast: CastAndCrew[]; crew: CastAndCrew[] } | null> => {
    if (!BASE_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return null;
    }
    const url = `${BASE_URL}/movie/${id}/credits?language=en-US`;

    const credits = await fetchAPI<{
      cast: CastAndCrew[];
      crew: CastAndCrew[];
    }>(url);

    if (!credits) {
      console.error(`Failed to fetch credits for movie with ID: ${id}`);
      return null;
    }

    return credits;
  }
);

/**
 * Fetches currently playing movies from TMDB API
 * @param region - ISO 3166-1 country code (e.g., "US", "CA", "GB")
 * @returns Array of movies or null if request fails
 */
export const getNowPlayingMovies = cache(
  async (region: string): Promise<Movie[] | null> => {
    if (!BASE_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return null;
    }
    const url = `${BASE_URL}/movie/now_playing?language=en-US&page=1&region=${region}`;
    const nowPlayingRes = await fetchAPIList<Movie>(url);
    return nowPlayingRes;
  }
);

/** How far back a release still counts as "current" for the home rows. */
const RELEASE_WINDOW_DAYS = 45;

function releaseWindow(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - RELEASE_WINDOW_DAYS);

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

/** TMDB release types: 2 and 3 are theatrical (limited and wide), 4 is digital. */
async function discoverByReleaseType(
  region: string,
  releaseTypes: string
): Promise<Movie[] | null> {
  const { from, to } = releaseWindow();
  const query = new URLSearchParams({
    include_adult: "false",
    language: "en-US",
    page: "1",
    region,
    "release_date.gte": from,
    "release_date.lte": to,
    sort_by: "popularity.desc",
    with_release_type: releaseTypes,
  });

  return fetchAPIList<Movie>(`${BASE_URL}/discover/movie?${query}`);
}

/**
 * The two home rows: what is in cinemas, and what has just landed digitally.
 *
 * /movie/now_playing cannot make this distinction — it is one theatrical-ish
 * list — so both come from /discover/movie filtered by release type.
 *
 * A film with both a theatrical and a digital release inside the window is
 * returned by both queries, so theatrical wins and is removed from digital.
 * Otherwise the same poster appears twice on one page.
 */
export const getReleaseRows = cache(
  async (
    region: string
  ): Promise<{ digital: Movie[]; theatrical: Movie[] } | null> => {
    if (!BASE_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return null;
    }

    const [theatrical, digital] = await Promise.all([
      discoverByReleaseType(region, "2|3"),
      discoverByReleaseType(region, "4"),
    ]);

    if (!theatrical || !digital) return null;

    const inCinemas = new Set(theatrical.map((movie) => movie.id));

    return {
      digital: digital.filter((movie) => !inCinemas.has(movie.id)),
      theatrical,
    };
  }
);

/**
 * Fetches upcoming movies from TMDB API
 * Filters to show only movies releasing tomorrow or later
 * @param region - ISO 3166-1 country code (e.g., "US", "CA", "GB")
 * @returns Array of movies sorted by release date or null if request fails
 */
export const getUpcomingMovies = cache(
  async (region: string): Promise<Movie[] | null> => {
    if (!BASE_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return null;
    }

    const url = `${BASE_URL}/movie/upcoming?language=en-US&page=1&region=${region}`;
    const upcomingRes = await fetchAPIList<Movie>(url);

    if (!upcomingRes) {
      return null;
    }

    // Get tomorrow's date (start of day in local timezone)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Filter movies that have release dates on or after tomorrow
    const filteredMovies = upcomingRes.filter((movie) => {
      if (!movie.release_date) return false;
      const releaseDate = new Date(movie.release_date);
      return releaseDate >= tomorrow;
    });

    // Sort by release date ascending
    filteredMovies.sort((a, b) => {
      const dateA = new Date(a.release_date).getTime();
      const dateB = new Date(b.release_date).getTime();
      return dateA - dateB;
    });

    return filteredMovies;
  }
);

/**
 * Searches movies and TV shows by title on TMDB API
 * @param term - Search query string
 * @returns Array of matching movies and shows, or null if the request fails
 */
export const getSearchResults = cache(
  async (term: string): Promise<MultiSearchItem[] | null> => {
    if (!BASE_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return null;
    }
    const url = `${BASE_URL}/search/multi?query=${encodeURIComponent(term)}&include_adult=false&language=en-US&page=1`;
    const searchResults = await fetchAPIList<MultiSearchItem>(url);

    if (!searchResults) {
      return null;
    }

    // /search/multi also returns people, which have no detail page here.
    return searchResults.filter(
      (result) => result.media_type === "movie" || result.media_type === "tv"
    );
  }
);

/**
 * Fetches trending movies for the current week from TMDB API
 * @returns Array of trending movies or null if request fails
 */
export const getTrendingMovies = cache(async (): Promise<Movie[] | null> => {
  if (!BASE_URL) {
    console.error("NEXT_PUBLIC_API_URL is not defined");
    return null;
  }
  const url = `${BASE_URL}/trending/movie/week?language=en-US`;
  const trendingRes = await fetchAPIList<Movie>(url);
  return trendingRes;
});

/**
 * Fetches movie trailers/videos from TMDB API
 * Prioritizes official trailers, falls back to teasers
 */
export const getMovieTrailer = cache(
  async (movieId: string): Promise<string | null> => {
    try {
      const url = `${BASE_URL}/movie/${movieId}/videos?language=en-US`;

      const response = await fetch(url, tmdbRequestOptions());

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const videos = data.results || [];

      // Find official trailer (YouTube only)
      const trailer = videos.find(
        (video: {
          site: string;
          type: string;
          official: boolean;
          size: number;
        }) =>
          video.site === "YouTube" &&
          (video.type === "Trailer" || video.type === "Teaser") &&
          video.official === true &&
          video.size === 1080
      );

      return trailer?.key || null;
    } catch {
      return null;
    }
  }
);

export const getPersonMovieCredits = cache(
  async (
    id: string
  ): Promise<{
    cast: PersonMovieCredit[];
    crew: PersonMovieCredit[];
  } | null> => {
    if (!BASE_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return null;
    }
    const url = `${BASE_URL}/person/${id}/movie_credits?language=en-US`;
    const credits = await fetchAPI<{
      cast: PersonMovieCredit[];
      crew: PersonMovieCredit[];
    }>(url);
    if (!credits) {
      console.error(`Failed to fetch movie credits for person with ID: ${id}`);
      return null;
    }
    return credits;
  }
);

export const getPerson = cache(async (id: string): Promise<Person | null> => {
  if (!BASE_URL) {
    console.error("NEXT_PUBLIC_API_URL is not defined");
    return null;
  }
  const url = `${BASE_URL}/person/${id}?language=en-US`;

  const person = await fetchAPI<Person>(url);

  if (!person) {
    console.error(`Failed to fetch movie with ID: ${id}`);
  }

  return person;
});
