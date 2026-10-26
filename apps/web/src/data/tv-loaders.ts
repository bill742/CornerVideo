import "server-only";

import { cache } from "react";

import type {
  CastAndCrew,
  TVSeason,
  TVShow,
} from "@/types";
import {
  fetchAPI,
  fetchAPIList,
  tmdbRequestOptions,
  tmdbUncachedRequestOptions,
} from "@/utils/fetch-apis";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const getTrendingTV = cache(async (): Promise<TVShow[] | null> => {
  if (!BASE_URL) return null;
  return fetchAPIList<TVShow>(`${BASE_URL}/trending/tv/week?language=en-US`);
});

export const getOnTheAirTV = cache(
  async (region: string): Promise<TVShow[] | null> => {
    if (!BASE_URL) return null;
    return fetchAPIList<TVShow>(
      `${BASE_URL}/tv/on_the_air?language=en-US&page=1&region=${region}`,
    );
  },
);

export const getTVShow = cache(
  async (id: string): Promise<TVShow | null> => {
    if (!BASE_URL) return null;
    return fetchAPI<TVShow>(`${BASE_URL}/tv/${id}?language=en-US`);
  },
);

/** getTVShow without Next's data cache, for My Shelf. See getShelfMovie. */
export const getShelfTVShow = cache(
  async (id: string): Promise<TVShow | null> => {
    if (!BASE_URL) return null;
    return fetchAPI<TVShow>(
      `${BASE_URL}/tv/${id}?language=en-US`,
      tmdbUncachedRequestOptions(),
    );
  },
);

export const getTVSeason = cache(
  async (showId: string, seasonNumber: string): Promise<TVSeason | null> => {
    if (!BASE_URL) return null;
    return fetchAPI<TVSeason>(
      `${BASE_URL}/tv/${showId}/season/${seasonNumber}?language=en-US`,
    );
  },
);

export const getTVCastAndCrew = cache(
  async (
    id: string,
  ): Promise<{ cast: CastAndCrew[]; crew: CastAndCrew[] } | null> => {
    if (!BASE_URL) return null;
    const credits = await fetchAPI<{ cast: CastAndCrew[]; crew: CastAndCrew[] }>(
      `${BASE_URL}/tv/${id}/credits?language=en-US`,
    );
    return credits ?? null;
  },
);

export const getTVTrailer = cache(
  async (showId: string): Promise<string | null> => {
    try {
      const url = `${BASE_URL}/tv/${showId}/videos?language=en-US`;
      const response = await fetch(url, tmdbRequestOptions());
      if (!response.ok) return null;
      const data = await response.json();
      const videos: { site: string; type: string; official: boolean; key: string }[] =
        data.results ?? [];
      const trailer = videos.find(
        (v) =>
          v.site === "YouTube" &&
          (v.type === "Trailer" || v.type === "Teaser") &&
          v.official,
      );
      return trailer?.key ?? null;
    } catch {
      return null;
    }
  },
);

export const getTVSearchResults = cache(
  async (term: string): Promise<TVShow[] | null> => {
    if (!BASE_URL) return null;
    return fetchAPIList<TVShow>(
      `${BASE_URL}/search/tv?query=${encodeURIComponent(term)}&include_adult=false&language=en-US&page=1`,
    );
  },
);
