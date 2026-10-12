import { Suspense } from "react";

import type { Metadata } from "next";

import { SkeletonCardList } from "@/components/skeletons/skeleton-card-list";

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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-12 py-8">
          <SkeletonCardList />
        </div>
      }
    >
      <ClientSearch />
    </Suspense>
  );
}
