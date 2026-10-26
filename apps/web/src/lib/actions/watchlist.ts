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

/**
 * Returns `{ error }` rather than throwing. A production build replaces a
 * thrown action error's message with a generic "Server Components render"
 * notice, so a full shelf read as a crash instead of saying why.
 */
export async function addToWatchlist(
  tmdbId: number,
  mediaType: MediaType,
  status: WatchStatus = "want_to_watch"
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add titles to your shelf." };

  // Enforce free tier limit.
  const { count, error: countError } = await supabase
    .from("watchlist_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    console.error("addToWatchlist count failed:", countError.message);
    return { error: "Could not update your shelf. Try again." };
  }

  // TODO: replace with real premium check once subscriptions are wired up.
  const isPremium = false;

  if (!isPremium && (count ?? 0) >= FREE_WATCHLIST_LIMIT) {
    return {
      error: `Free accounts can keep ${FREE_WATCHLIST_LIMIT} titles on their shelf. Remove one to make room, or upgrade for unlimited space.`,
    };
  }

  const { error } = await supabase
    .from("watchlist_items")
    .upsert(
      { media_type: mediaType, status, tmdb_id: tmdbId, user_id: user.id },
      { onConflict: "user_id,tmdb_id,media_type" }
    );

  if (error) {
    console.error("addToWatchlist upsert failed:", error.message);
    return { error: "Could not update your shelf. Try again." };
  }
  revalidateWatchlist();
  return { error: null };
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
