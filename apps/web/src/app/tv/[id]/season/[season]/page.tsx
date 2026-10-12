import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ArrowLeft, Calendar, Tv } from "lucide-react";

import { EpisodeList } from "@/components/episodes/episode-list";

import { getTVSeason, getTVShow } from "@/data/tv-loaders";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; season: string }>;
}): Promise<Metadata> {
  const { id, season } = await params;
  const [show, seasonData] = await Promise.all([
    getTVShow(id),
    getTVSeason(id, season),
  ]);
  if (!show || !seasonData) return { title: "Season Not Found" };
  return {
    description: seasonData.overview || `${show.name} — ${seasonData.name}`,
    title: `${show.name}: ${seasonData.name}`,
  };
}

export default async function TVSeasonPage({
  params,
}: {
  params: Promise<{ id: string; season: string }>;
}) {
  const { id, season } = await params;

  const [show, seasonData] = await Promise.all([
    getTVShow(id),
    getTVSeason(id, season),
  ]);

  if (!show || !seasonData) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Season not found.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let watchedEpisodes: number[] = [];
  if (user) {
    const { data } = await supabase
      .from("episode_watches")
      .select("episode_number")
      .eq("user_id", user.id)
      .eq("show_tmdb_id", Number(id))
      .eq("season_number", seasonData.season_number);
    watchedEpisodes = (data ?? []).map((r) => r.episode_number);
  }

  const watchedCount = watchedEpisodes.filter((n) =>
    seasonData.episodes.some((e) => e.episode_number === n)
  ).length;

  return (
    <div className="space-y-8 py-8">
      {/* Back link */}
      <Link
        href={`/tv/${id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {show.name}
      </Link>

      {/* Season header */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {seasonData.poster_path && (
          <div className="relative h-48 w-32 shrink-0 overflow-hidden rounded-sm shadow-lg">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w342${seasonData.poster_path}`}
              alt={seasonData.name}
              fill
              // Fixed w-32 container at every breakpoint.
              sizes="128px"
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground text-sm">{show.name}</p>
            <h1 className="font-display text-4xl font-semibold tracking-wide">
              {seasonData.name}
            </h1>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            {seasonData.air_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(seasonData.air_date).getFullYear()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Tv className="h-4 w-4" />
              {seasonData.episodes.length} episode
              {seasonData.episodes.length !== 1 ? "s" : ""}
            </span>
            {user && (
              <span className="text-new-release font-medium">
                {watchedCount}/{seasonData.episodes.length} watched
              </span>
            )}
          </div>

          {seasonData.overview && (
            <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
              {seasonData.overview}
            </p>
          )}
        </div>
      </div>

      {/* Episode list */}
      <EpisodeList
        episodes={seasonData.episodes}
        isLoggedIn={!!user}
        seasonNumber={seasonData.season_number}
        showTmdbId={Number(id)}
        watchedEpisodes={watchedEpisodes}
      />
    </div>
  );
}
