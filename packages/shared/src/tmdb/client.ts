import type {
  CastAndCrew,
  Movie,
  MultiSearchItem,
  TVSeason,
  TVShow,
} from "../types";

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

// ─── Configuration ────────────────────────────────────────────────────────────

export interface TmdbClientConfig {
  /**
   * Where TMDB reads are sent. Either TMDB itself
   * ("https://api.themoviedb.org/3") or a proxy that forwards to it and holds
   * the credential server-side ("https://example.com/api/tmdb").
   */
  baseUrl: string;
  /**
   * Authorization header value, e.g. "Bearer <token>". Omit when `baseUrl`
   * points at a proxy that authenticates on our behalf — a client that cannot
   * keep a secret should not be given one.
   */
  bearerToken?: string;
  /** TMDB image base, e.g. "https://image.tmdb.org/t/p/". */
  imageBase: string;
}

/**
 * Framework-agnostic TMDB client shared across apps (web + mobile).
 *
 * Deliberately free of any framework coupling: no React `cache()`, no
 * `process.env` reads. Pass config in so each app can wire its own env vars
 * (`NEXT_PUBLIC_*` on web, `EXPO_PUBLIC_*` on mobile). Loaders return `null` on
 * failure rather than throwing — same contract as the web data loaders.
 */
export function createTmdbClient({
  baseUrl,
  bearerToken,
  imageBase,
}: TmdbClientConfig) {
  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (bearerToken) {
    headers.Authorization = bearerToken;
  }

  async function fetchApi<T>(url: string): Promise<T | null> {
    try {
      const response = await fetch(url, { headers, method: "GET" });
      if (!response.ok) {
        console.error(
          `TMDB request failed: ${response.status} ${response.statusText}`,
        );
        return null;
      }
      return (await response.json()) as T;
    } catch (error) {
      console.error("TMDB fetch error:", error);
      return null;
    }
  }

  async function fetchApiList<T>(url: string): Promise<T[] | null> {
    const result = await fetchApi<{ results: T[] }>(url);
    return result?.results ?? null;
  }

  /** TMDB release types: 2 and 3 are theatrical (limited and wide), 4 is digital. */
  function discoverByReleaseType(
    region: string,
    releaseTypes: string,
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

    return fetchApiList<Movie>(`${baseUrl}/discover/movie?${query}`);
  }

  return {
    /** Build a full image URL from a TMDB path, e.g. imageUrl(poster_path, "w500"). */
    imageUrl(path: string | null, size = "w500"): string | null {
      if (!path) return null;
      return `${imageBase}${size}${path}`;
    },

    getMovie(id: number | string): Promise<Movie | null> {
      return fetchApi<Movie>(`${baseUrl}/movie/${id}?language=en-US`);
    },

    getMovieCredits(
      id: number | string,
    ): Promise<{ cast: CastAndCrew[]; crew: CastAndCrew[] } | null> {
      return fetchApi(`${baseUrl}/movie/${id}/credits?language=en-US`);
    },

    getNowPlayingMovies(region: string): Promise<Movie[] | null> {
      return fetchApiList<Movie>(
        `${baseUrl}/movie/now_playing?language=en-US&page=1&region=${region}`,
      );
    },

    /**
     * The "In Theatres" and "New on Digital" home rows. A film with both a
     * theatrical and a digital release inside the window is returned by both
     * queries, so theatrical wins and is removed from digital.
     */
    async getReleaseRows(
      region: string,
    ): Promise<{ digital: Movie[]; theatrical: Movie[] } | null> {
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
    },

    /** "Coming Soon": upcoming movies releasing tomorrow or later, soonest first. */
    async getUpcomingMovies(region: string): Promise<Movie[] | null> {
      const results = await fetchApiList<Movie>(
        `${baseUrl}/movie/upcoming?language=en-US&page=1&region=${region}`,
      );
      if (!results) return null;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      return results
        .filter(
          (movie) =>
            movie.release_date && new Date(movie.release_date) >= tomorrow,
        )
        .sort(
          (a, b) =>
            new Date(a.release_date).getTime() -
            new Date(b.release_date).getTime(),
        );
    },

    getTrendingMovies(): Promise<Movie[] | null> {
      return fetchApiList<Movie>(`${baseUrl}/trending/movie/week?language=en-US`);
    },

    // ─── TV ─────────────────────────────────────────────────────────────────

    getTrendingTV(): Promise<TVShow[] | null> {
      return fetchApiList<TVShow>(`${baseUrl}/trending/tv/week?language=en-US`);
    },

    getOnTheAirTV(region: string): Promise<TVShow[] | null> {
      return fetchApiList<TVShow>(
        `${baseUrl}/tv/on_the_air?language=en-US&page=1&region=${region}`,
      );
    },

    getTVShow(id: number | string): Promise<TVShow | null> {
      return fetchApi<TVShow>(`${baseUrl}/tv/${id}?language=en-US`);
    },

    getTVSeason(
      id: number | string,
      seasonNumber: number | string,
    ): Promise<TVSeason | null> {
      return fetchApi<TVSeason>(
        `${baseUrl}/tv/${id}/season/${seasonNumber}?language=en-US`,
      );
    },

    // ─── Search ─────────────────────────────────────────────────────────────

    /** Multi-search across movies and TV (people are filtered out). */
    async multiSearch(term: string): Promise<MultiSearchItem[] | null> {
      const results = await fetchApiList<MultiSearchItem>(
        `${baseUrl}/search/multi?query=${encodeURIComponent(
          term,
        )}&include_adult=false&language=en-US&page=1`,
      );
      return (
        results?.filter(
          (r) => r.media_type === "movie" || r.media_type === "tv",
        ) ?? null
      );
    },
  };
}

export type TmdbClient = ReturnType<typeof createTmdbClient>;
