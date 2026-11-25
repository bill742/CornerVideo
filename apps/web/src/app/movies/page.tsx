import type { Metadata } from "next";

import { BrowseHeader } from "@/components/browse/browse-header";
import { MovieFetcher } from "@/components/movies/movie-fetcher";

import { RegionProvider } from "@/lib/region-context";

export const metadata: Metadata = {
  alternates: { canonical: "/movies" },
  description:
    "Movies in theatres now, new on digital, and coming soon, with release dates. Add any of them to your shelf.",
  title: "Upcoming Movies & Release Dates",
};

/**
 * Fully static, like the old homepage it replaces: the rows fetch TMDB from
 * the browser through the route handlers in src/app/api, and RegionProvider
 * resolves the signed-in member's region there too.
 */
export default function MoviesPage() {
  return (
    <div className="space-y-12 py-8">
      <BrowseHeader active="movies" />
      <RegionProvider>
        <MovieFetcher />
      </RegionProvider>
    </div>
  );
}
