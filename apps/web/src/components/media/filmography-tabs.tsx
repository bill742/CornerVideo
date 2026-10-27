"use client";

import { useState } from "react";

import { Clapperboard, Tv } from "lucide-react";

import { TabButton } from "@/components/tab-button";

import type { MediaType } from "@/types";

interface FilmographyTabsProps {
  defaultTab: MediaType;
  /** Server-rendered sections; null when the person has none of that kind. */
  movies: React.ReactNode | null;
  tv: React.ReactNode | null;
}

/**
 * Movies / TV Shows switch for a person page, matching the home page's. The
 * sections arrive pre-rendered from the server, so switching costs nothing.
 * With credits of only one kind there is nothing to switch, so no toggle.
 */
function FilmographyTabs({ defaultTab, movies, tv }: FilmographyTabsProps) {
  const [activeTab, setActiveTab] = useState<MediaType>(defaultTab);

  if (!movies || !tv) return movies ?? tv;

  return (
    <div className="space-y-12">
      <div className="bg-card flex w-fit gap-1 rounded-sm border p-1">
        <TabButton
          active={activeTab === "movie"}
          icon={<Clapperboard className="h-4 w-4" />}
          label="Movies"
          onClick={() => setActiveTab("movie")}
        />
        <TabButton
          active={activeTab === "tv"}
          icon={<Tv className="h-4 w-4" />}
          label="TV Shows"
          onClick={() => setActiveTab("tv")}
        />
      </div>

      {activeTab === "movie" ? movies : tv}
    </div>
  );
}

FilmographyTabs.displayName = "FilmographyTabs";

export { FilmographyTabs };
