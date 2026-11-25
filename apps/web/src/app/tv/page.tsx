import type { Metadata } from "next";

import { BrowseHeader } from "@/components/browse/browse-header";
import { TVFetcher } from "@/components/tv/tv-fetcher";

import { RegionProvider } from "@/lib/region-context";

export const metadata: Metadata = {
  alternates: { canonical: "/tv" },
  description:
    "TV shows airing now, new seasons, and premiere dates for what's coming. Add any of them to your shelf.",
  title: "TV Premiere Dates",
};

/** Fully static; see /movies. */
export default function TVPage() {
  return (
    <div className="space-y-12 py-8">
      <BrowseHeader active="tv" />
      <RegionProvider>
        <TVFetcher />
      </RegionProvider>
    </div>
  );
}
