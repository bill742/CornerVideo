import {
  DEFAULT_REGION,
  type Profile,
  type Theme,
} from "@moviewatchlist/shared";

import { supabase } from "./supabase";

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * The signed-in user's profile row, or null if it has not been created yet.
 *
 * A `handle_new_user` trigger inserts one per auth user, so this is normally
 * present — but returning null rather than throwing keeps a first run from
 * blocking the whole screen.
 */
export async function getProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

/**
 * Region is read on every Browse focus but changes about once per account, so
 * it is held in memory after the first read rather than re-queried each time.
 *
 * The cost is staleness in one direction: changing region on the web app is not
 * picked up here until the next launch or sign-in. Writes made on this device
 * update the cache directly, so those are immediate.
 */
let cachedRegion: string | null = null;

export async function getRegion(): Promise<string> {
  if (cachedRegion !== null) return cachedRegion;

  const profile = await getProfile().catch(() => null);
  // Only a real read is cached. Browse renders for a moment before the auth
  // redirect on a signed-out launch, and caching that failed read pinned the
  // default region for the whole session after sign-in.
  if (!profile) return DEFAULT_REGION;

  cachedRegion = profile.region ?? DEFAULT_REGION;
  return cachedRegion;
}

/** Called on sign-out so the next account does not inherit this one's region. */
export function clearRegionCache(): void {
  cachedRegion = null;
}

/** Shared with the web app, which reads the same column for its own filtering. */
export async function updateRegion(region: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ region, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  cachedRegion = region;
}

/** Shared with the web app's Membership page, which saves the same column. */
export async function updateProfileTheme(theme: Theme): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ theme, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
