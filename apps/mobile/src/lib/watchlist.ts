import {
  FREE_WATCHLIST_LIMIT,
  type MediaType,
  SHELF_FULL_MESSAGE,
  WATCHLIST_LIMIT_ERROR,
  type WatchStatus,
  type WatchlistItem,
} from "@moviewatchlist/shared";

import { isPremium } from "./premium";
import { supabase } from "./supabase";

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

/** All watchlist rows for the current user, newest first. */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as WatchlistItem[]) ?? [];
}

/** The saved status for one title, or null when it isn't on the watchlist. */
export async function getWatchlistStatus(
  tmdbId: number,
  mediaType: MediaType,
): Promise<WatchStatus | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("status")
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.status as WatchStatus | undefined) ?? null;
}

export async function addToWatchlist(
  tmdbId: number,
  mediaType: MediaType,
  status: WatchStatus = "want_to_watch",
): Promise<void> {
  const userId = await requireUserId();

  // Enforce the free-tier limit (mirrors the web server action).
  const { count } = await supabase
    .from("watchlist_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= FREE_WATCHLIST_LIMIT && !(await isPremium())) {
    throw new Error(SHELF_FULL_MESSAGE);
  }

  const { error } = await supabase
    .from("watchlist_items")
    .upsert(
      { media_type: mediaType, status, tmdb_id: tmdbId, user_id: userId },
      { onConflict: "user_id,tmdb_id,media_type" },
    );
  // The database enforces the limit too (migration 003), which catches a
  // subscription that lapsed between the check above and this write.
  if (error?.message === WATCHLIST_LIMIT_ERROR) {
    throw new Error(SHELF_FULL_MESSAGE);
  }
  if (error) throw new Error(error.message);
}

export async function removeFromWatchlist(
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);
  if (error) throw new Error(error.message);
}

export async function updateWatchStatus(
  tmdbId: number,
  mediaType: MediaType,
  status: WatchStatus,
): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("watchlist_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);
  if (error) throw new Error(error.message);
}
