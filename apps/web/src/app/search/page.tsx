import { Suspense } from "react";

import type { Metadata } from "next";

import { VhsLoader } from "@/components/brand/vhs-loader";
import { ShelfHeading } from "@/components/media/media-list";

import { BRAND } from "@/types";

import { ClientSearch } from "./client-search";

type SearchPageProps = {
  searchParams: Promise<{ term?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { term } = await searchParams;

  if (!term) {
    return {
      description: `Search movies and TV shows on ${BRAND.name}.`,
      title: "Search",
    };
  }

  return {
    alternates: {
      canonical: `/search?term=${encodeURIComponent(term)}`,
    },
    description: `Search results for "${term}" on ${BRAND.name}.`,
    title: `"${term}" search results`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { term } = await searchParams;

  // Same heading ClientSearch renders, so the page has its <h1> from the
  // first paint through to results.
  return (
    <Suspense
      fallback={
        <div className="space-y-6 py-8">
          <ShelfHeading level={1}>
            Results for &quot;{term ?? ""}&quot;
          </ShelfHeading>
          <VhsLoader label="Loading search results" />
        </div>
      }
    >
      <ClientSearch />
    </Suspense>
  );
}
