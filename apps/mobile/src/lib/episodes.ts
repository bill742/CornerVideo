import type { WatchStatus } from "@moviewatchlist/shared";

import { requireUserId, signedInUserId } from "./session";
import { supabase } from "./supabase";
import { tmdb } from "./tmdb";
import {
  addToWatchlist,
  getWatchlistStatus,
  updateWatchStatus,
} from "./watchlist";

/** Episode numbers the user has marked watched for one season; none for a guest. */
export async function getWatchedEpisodes(
  showTmdbId: number,
  seasonNumber: number,
): Promise<number[]> {
  const userId = await signedInUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("episode_watches")
    .select("episode_number")
    .eq("user_id", userId)
    .eq("show_tmdb_id", showTmdbId)
    .eq("season_number", seasonNumber);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.episode_number as number);
}

export async function markEpisodeWatched(
  showTmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("episode_watches").upsert(
    {
      episode_number: episodeNumber,
      season_number: seasonNumber,
      show_tmdb_id: showTmdbId,
      user_id: userId,
    },
    { onConflict: "user_id,show_tmdb_id,season_number,episode_number" },
  );
  if (error) throw new Error(error.message);
}

/** Mark every supplied episode of a season watched in a single upsert. */
export async function markSeasonWatched(
  showTmdbId: number,
  seasonNumber: number,
  episodeNumbers: number[],
): Promise<void> {
  if (episodeNumbers.length === 0) return;
  const userId = await requireUserId();
  const rows = episodeNumbers.map((episodeNumber) => ({
    episode_number: episodeNumber,
    season_number: seasonNumber,
    show_tmdb_id: showTmdbId,
    user_id: userId,
  }));
  const { error } = await supabase.from("episode_watches").upsert(rows, {
    onConflict: "user_id,show_tmdb_id,season_number,episode_number",
  });
  if (error) throw new Error(error.message);
}

export async function unmarkEpisodeWatched(
  showTmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("episode_watches")
    .delete()
    .eq("user_id", userId)
    .eq("show_tmdb_id", showTmdbId)
    .eq("season_number", seasonNumber)
    .eq("episode_number", episodeNumber);
  if (error) throw new Error(error.message);
}

/**
 * Reconcile a show's watchlist status with episode progress: any watched
 * episode bumps it to "watching", and watching every episode marks it
 * "watched". A show that isn't on the watchlist yet is added automatically
 * at the computed status. Specials (season 0) are ignored to match TMDB's
 * episode count. It never downgrades to "want_to_watch", and it won't add a
 * show that has no watched episodes (e.g. after unmarking the last one).
 */
export async function syncShowWatchStatus(
  showTmdbId: number,
): Promise<WatchStatus | null> {
  // A guest has no shelf to reconcile.
  const userId = await signedInUserId();
  if (!userId) return null;
  const { count, error } = await supabase
    .from("episode_watches")
    .select("episode_number", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("show_tmdb_id", showTmdbId)
    .gt("season_number", 0);
  if (error) throw new Error(error.message);
  const watchedCount = count ?? 0;

  const current = await getWatchlistStatus(showTmdbId, "tv");

  // Nothing watched: don't auto-add, and don't downgrade an existing status.
  if (watchedCount === 0) return current;

  const show = await tmdb.getTVShow(showTmdbId);
  const totalEpisodes = show?.number_of_episodes ?? 0;
  const next: WatchStatus =
    totalEpisodes > 0 && watchedCount >= totalEpisodes ? "watched" : "watching";

  if (current === null) {
    await addToWatchlist(showTmdbId, "tv", next);
  } else if (next !== current) {
    await updateWatchStatus(showTmdbId, "tv", next);
  }
  return next;
}
