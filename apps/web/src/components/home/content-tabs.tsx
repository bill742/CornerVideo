"use client";

import { useState } from "react";

import { Clapperboard, Tv } from "lucide-react";

import { MovieFetcher } from "@/components/movies/movie-fetcher";
import { TabButton } from "@/components/tab-button";
import { TVFetcher } from "@/components/tv/tv-fetcher";

type Tab = "movies" | "tv";

function ContentTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("movies");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-wide md:text-5xl">
            Browse the aisles
          </h1>
          <p className="text-muted-foreground mt-1">
            What&apos;s new, what&apos;s coming, and what everyone&apos;s
            renting.
          </p>
        </div>
        <div className="bg-card flex w-fit gap-1 rounded-sm border p-1">
          <TabButton
            active={activeTab === "movies"}
            icon={<Clapperboard className="h-4 w-4" />}
            label="Movies"
            onClick={() => setActiveTab("movies")}
          />
          <TabButton
            active={activeTab === "tv"}
            icon={<Tv className="h-4 w-4" />}
            label="TV Shows"
            onClick={() => setActiveTab("tv")}
          />
        </div>
      </div>

      {activeTab === "movies" ? <MovieFetcher /> : <TVFetcher />}
    </div>
  );
}

ContentTabs.displayName = "ContentTabs";

export { ContentTabs };
