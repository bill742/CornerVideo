import type { MediaType } from "@/types";

/**
 * The title a signed-out visitor tried to put on their shelf, kept in
 * localStorage until they've signed in so it can be added for them
 * (PendingAddCompleter, in the root layout).
 *
 * localStorage rather than a query parameter: the email-confirmation link
 * goes through the Supabase template and /auth/confirm, which drop any
 * `next`, but the same browser keeps this.
 */
interface PendingAdd {
  mediaType: MediaType;
  savedAt: number;
  tmdbId: number;
}

const PENDING_ADD_KEY = "cv_pending_add";

/** Long enough to find the confirmation email; short enough not to surprise. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Fired on window after the shelf changes outside an AddToWatchlistButton. */
const SHELF_CHANGED_EVENT = "cv:shelf-changed";

function savePendingAdd(mediaType: MediaType, tmdbId: number) {
  const value: PendingAdd = { mediaType, savedAt: Date.now(), tmdbId };
  try {
    window.localStorage.setItem(PENDING_ADD_KEY, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the visitor just adds it themselves.
  }
}

function clearPendingAdd() {
  try {
    window.localStorage.removeItem(PENDING_ADD_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** The pending add, or null if there's none or it's malformed or stale. */
function readPendingAdd(): PendingAdd | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(PENDING_ADD_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<PendingAdd>;
    const valid =
      (value.mediaType === "movie" || value.mediaType === "tv") &&
      Number.isInteger(value.tmdbId) &&
      (value.tmdbId as number) > 0 &&
      typeof value.savedAt === "number" &&
      Date.now() - value.savedAt < MAX_AGE_MS;
    if (valid) return value as PendingAdd;
  } catch {
    // Fall through and drop it.
  }
  clearPendingAdd();
  return null;
}

/** The title's own page, built from the id rather than anything stored. */
function titlePath(mediaType: MediaType, tmdbId: number) {
  return mediaType === "movie" ? `/movies/${tmdbId}` : `/tv/${tmdbId}`;
}

export {
  clearPendingAdd,
  readPendingAdd,
  savePendingAdd,
  SHELF_CHANGED_EVENT,
  titlePath,
};
export type { PendingAdd };
