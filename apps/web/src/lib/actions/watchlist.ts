"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  FREE_WATCHLIST_LIMIT,
  type MediaType,
  type WatchStatus,
} from "@/types";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return { supabase, user };
}

/**
 * Only /watchlist renders saved rows on the server. The movie and TV pages
 * are identical for every visitor — their shelf button reads its own state in
 * the browser — so revalidating them here bought nothing. It did cost plenty:
 * each add or remove threw away the page's shared ISR copy and re-rendered it
 * (TMDB fetches, cast, images) into the action's response, which made that
 * response slow enough to still be streaming when the user moved on.
 */
function revalidateWatchlist() {
  revalidatePath("/watchlist");
}

export async function addToWatchlist(
  tmdbId: number,
  mediaType: MediaType,
  status: WatchStatus = "want_to_watch"
) {
  const { supabase, user } = await getAuthenticatedUser();

  // Enforce free tier limit.
  const { count } = await supabase
    .from("watchlist_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // TODO: replace with real premium check once subscriptions are wired up.
  const isPremium = false;

  if (!isPremium && (count ?? 0) >= FREE_WATCHLIST_LIMIT) {
    throw new Error(
      `Free accounts are limited to ${FREE_WATCHLIST_LIMIT} items. Upgrade to premium for unlimited watchlist.`
    );
  }

  const { error } = await supabase
    .from("watchlist_items")
    .upsert(
      { media_type: mediaType, status, tmdb_id: tmdbId, user_id: user.id },
      { onConflict: "user_id,tmdb_id,media_type" }
    );

  if (error) throw new Error(error.message);
  revalidateWatchlist();
}

export async function removeFromWatchlist(
  tmdbId: number,
  mediaType: MediaType
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) throw new Error(error.message);
  revalidateWatchlist();
}

export async function updateWatchStatus(
  tmdbId: number,
  mediaType: MediaType,
  status: WatchStatus
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("watchlist_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) throw new Error(error.message);
  revalidateWatchlist();
}

export async function getWatchlistItems() {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
