import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import type { WatchlistItem } from "@moviewatchlist/shared";
import { Platform } from "react-native";

import { isPremium } from "./premium";
import { signedInUserId } from "./session";
import { tmdb } from "./tmdb";
import { getWatchlist } from "./watchlist";

/**
 * Release-day reminders, scheduled as *local* notifications on this device.
 *
 * There is no push server: each sync reads the watchlist, looks up the next
 * release date for every title on TMDB, and schedules one notification per
 * title. A date TMDB changes after the last sync is only picked up by the next
 * one, so syncs run on launch, on returning to the foreground, and after any
 * watchlist change.
 *
 * Premium-only (see PLAN.md). The on/off switch is a per-device preference —
 * the notifications themselves only ever exist on this device.
 *
 * Notification permission is asked for in context, never at launch: when the
 * member turns New release alerts on in Membership, or when a Premium member
 * who has never chosen adds a title with a release still to come
 * (`shouldOfferAlerts`).
 */

const ENABLED_KEY = "reminders:enabled";
const CHANNEL_ID = "release-reminders";
const ID_PREFIX = "release:";

/** Local hour on release day the reminder fires. */
const REMINDER_HOUR = 9;

/**
 * A release found after its REMINDER_HOUR has passed — added to the watchlist
 * that afternoon, say — still gets a reminder, this long after the sync.
 */
const CATCH_UP_DELAY_MS = 60_000;

/**
 * Every reminder this device has scheduled and when it fires, keyed by title
 * and release day. Syncs rerun on each app open, and without this record a
 * same-day catch-up would fire again every time, and a 9am reminder that
 * already fired would get a catch-up after it.
 */
const HISTORY_KEY = "reminders:history";

/** How long past its fire time an entry is kept before being forgotten. */
const HISTORY_TTL_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * iOS keeps at most 64 pending local notifications per app and silently drops
 * the rest. Stay under it, soonest releases first.
 */
const MAX_SCHEDULED = 60;

/** TMDB lookups in flight at once — one per watchlist title. */
const LOOKUP_CONCURRENCY = 5;

/** `at` is the fire time (epoch ms), kept here because the native trigger shape differs by platform. */
type ReminderData = { at: number; url: string };

/** `${reminder id}@${release day}` → fire time (epoch ms). */
type History = Record<string, number>;

interface Release {
  body: string;
  /** REMINDER_HOUR local time on the release day. */
  date: Date;
  /** The release day as TMDB gives it, e.g. "2026-10-03". */
  day: string;
  id: string;
  title: string;
  url: string;
}

export async function getRemindersEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === "true";
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, String(enabled));
}

/**
 * Forget the on/off choice, so the next member to sign in on this device is
 * offered alerts afresh. Called on sign-out and account deletion.
 */
export async function resetRemindersPreference(): Promise<void> {
  await AsyncStorage.removeItem(ENABLED_KEY);
}

/**
 * Ask for notification permission if it hasn't been decided yet. Returns
 * whether notifications can be shown.
 */
export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

/** "denied" means the user has refused; "undetermined" that they haven't been asked. */
export async function getReminderPermission(): Promise<Notifications.PermissionStatus> {
  return (await Notifications.getPermissionsAsync()).status;
}

async function hasReminderPermission(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/**
 * "2026-10-03" at REMINDER_HOUR local time. TMDB dates are calendar days with
 * no zone, so `new Date("2026-10-03")` (UTC midnight) would land on the
 * previous evening anywhere west of Greenwich.
 */
function reminderDate(day: string | null | undefined): Date | null {
  const match = day ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  if (!match) return null;
  const [, year, month, date] = match.map(Number);
  return new Date(year, month - 1, date, REMINDER_HOUR);
}

/**
 * The next release for one watchlist title, or null if it has none coming.
 *
 * Throws when TMDB can't be reached rather than returning null: the client
 * reports a failed request as null, and treating an outage as "nothing coming"
 * would make the sync cancel every reminder.
 */
async function lookupRelease(item: WatchlistItem): Promise<Release | null> {
  if (item.media_type === "movie") {
    const movie = await tmdb.getMovie(item.tmdb_id);
    if (!movie) throw new Error(`TMDB lookup failed for movie ${item.tmdb_id}`);
    const date = reminderDate(movie.release_date);
    if (!date) return null;

    return {
      body: "Out today.",
      date,
      day: movie.release_date,
      id: `${ID_PREFIX}movie:${movie.id}`,
      title: movie.title,
      url: `/movie/${movie.id}`,
    };
  }

  const show = await tmdb.getTVShow(item.tmdb_id);
  if (!show) throw new Error(`TMDB lookup failed for TV ${item.tmdb_id}`);
  const episode = show.next_episode_to_air;
  const date = reminderDate(episode?.air_date);
  if (!episode?.air_date || !date) return null;

  return {
    body: `S${episode.season_number} E${episode.episode_number} airs today.`,
    date,
    day: episode.air_date,
    id: `${ID_PREFIX}tv:${show.id}`,
    title: show.name,
    url: `/tv/${show.id}/season/${episode.season_number}`,
  };
}

async function lookupReleases(items: WatchlistItem[]): Promise<Release[]> {
  const releases: Release[] = [];
  for (let i = 0; i < items.length; i += LOOKUP_CONCURRENCY) {
    const batch = items.slice(i, i + LOOKUP_CONCURRENCY);
    const found = await Promise.all(batch.map(lookupRelease));
    for (const release of found) {
      if (release) releases.push(release);
    }
  }
  return releases;
}

/** Cancel every reminder this module scheduled, leaving anything else alone. */
export async function cancelReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(ID_PREFIX))
      .map((request) =>
        Notifications.cancelScheduledNotificationAsync(request.identifier),
      ),
  );
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: "Release reminders",
  });
}

async function readHistory(): Promise<History> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as History) : {};
  } catch {
    // A lost history costs at most one repeated reminder.
    return {};
  }
}

/** Called on sign-out so the next account starts with a clean slate. */
export async function clearReminderHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * When a release's reminder should fire, or null if it shouldn't (again).
 *
 * A reminder already scheduled keeps its original time, and one whose time has
 * passed has fired and is left alone. Otherwise it is 9am on release day, or —
 * on release day itself, after 9am — shortly after this sync.
 */
function fireTime(
  release: Release,
  history: History,
  now: number,
): number | null {
  const recorded = history[`${release.id}@${release.day}`];
  if (recorded !== undefined) return recorded > now ? recorded : null;

  if (release.date.getTime() > now) return release.date.getTime();
  if (isSameLocalDay(release.date, new Date(now)))
    return now + CATCH_UP_DELAY_MS;
  return null;
}

async function runSync(): Promise<void> {
  const enabled =
    (await signedInUserId()) !== null &&
    (await getRemindersEnabled()) &&
    (await hasReminderPermission()) &&
    (await isPremium());

  if (!enabled) {
    await cancelReminders();
    return;
  }

  const items = await getWatchlist();
  // Nothing left to remind about once it's been watched or given up on.
  const pending = items.filter(
    (item) => item.status === "want_to_watch" || item.status === "watching",
  );

  const found = await lookupReleases(pending);
  const history = await readHistory();
  const now = Date.now();

  const reminders = found
    .map((release) => ({ at: fireTime(release, history, now), release }))
    .filter((r): r is { at: number; release: Release } => r.at !== null)
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_SCHEDULED);

  await ensureChannel();
  // Replace wholesale so titles removed from the watchlist, or whose date
  // moved, don't keep a stale reminder.
  await cancelReminders();
  for (const { at, release } of reminders) {
    const data: ReminderData = { at, url: release.url };
    await Notifications.scheduleNotificationAsync({
      content: { body: release.body, data, title: release.title },
      identifier: release.id,
      trigger: {
        channelId: CHANNEL_ID,
        date: at,
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      },
    });
  }

  const nextHistory: History = {};
  for (const [key, at] of Object.entries(history)) {
    if (at > now - HISTORY_TTL_MS) nextHistory[key] = at;
  }
  for (const { at, release } of reminders) {
    nextHistory[`${release.id}@${release.day}`] = at;
  }
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
}

let inFlight: Promise<void> = Promise.resolve();

/**
 * Bring scheduled reminders in line with the watchlist. Safe to call often:
 * calls are serialised so two overlapping syncs can't interleave their
 * cancel-and-reschedule steps. Never throws. Lookups all finish before
 * anything is cancelled, so a sync that fails on the network leaves the
 * previous schedule in place.
 */
export function syncReminders(): Promise<void> {
  inFlight = inFlight
    .then(runSync)
    .catch((error) => console.warn("Reminder sync failed:", error));
  return inFlight;
}

/**
 * Whether to offer New release alerts right after this title was added: only
 * to a Premium member who has never turned them on or off on this device, for
 * a release still to come, and while the system would still show its
 * permission prompt (or has already granted it). Never throws.
 */
export async function shouldOfferAlerts(
  tmdbId: number,
  mediaType: WatchlistItem["media_type"],
): Promise<{ title: string } | null> {
  try {
    if ((await AsyncStorage.getItem(ENABLED_KEY)) !== null) return null;
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && !permission.canAskAgain) return null;
    if (!(await isPremium())) return null;

    const release = await lookupRelease({
      media_type: mediaType,
      tmdb_id: tmdbId,
    } as WatchlistItem);
    if (!release || release.date.getTime() <= Date.now()) return null;
    return { title: release.title };
  } catch {
    return null;
  }
}

/**
 * The member's answer to the offer: asks for notification permission on yes,
 * saves the choice either way, then syncs. Resolves to whether alerts are on.
 */
export async function answerAlertsOffer(accepted: boolean): Promise<boolean> {
  const enabled = accepted && (await requestReminderPermission());
  await setRemindersEnabled(enabled);
  await syncReminders();
  return enabled;
}

/** The deep link a tapped reminder should open, or null if it isn't one of ours. */
export function reminderUrl(
  response: Notifications.NotificationResponse,
): string | null {
  const { content, identifier } = response.notification.request;
  if (!identifier.startsWith(ID_PREFIX)) return null;

  const { url } = (content.data ?? {}) as Partial<ReminderData>;
  return typeof url === "string" ? url : null;
}

// ─── Dev tools ───────────────────────────────────────────────────────────────

/**
 * Schedule a reminder a few seconds out, shaped exactly like a real one, so the
 * banner and tap-to-open routing can be checked without waiting for a release.
 * Skips the premium gate and TMDB — those only decide *what* gets scheduled.
 * Dev builds only.
 */
export async function scheduleTestReminder(seconds = 5): Promise<void> {
  if (!(await requestReminderPermission())) {
    throw new Error("Notification permission denied");
  }
  await ensureChannel();

  const data: ReminderData = {
    at: Date.now() + seconds * 1000,
    url: "/movie/550",
  };
  await Notifications.scheduleNotificationAsync({
    content: { body: "Test reminder: out today.", data, title: "Fight Club" },
    identifier: `${ID_PREFIX}test`,
    trigger: {
      channelId: CHANNEL_ID,
      seconds,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    },
  });
}

/** Pending release reminders, soonest first — to confirm what a sync scheduled. */
export async function listScheduledReminders(): Promise<
  { date: Date | null; title: string }[]
> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled
    .filter((request) => request.identifier.startsWith(ID_PREFIX))
    .map((request) => {
      const { at } = (request.content.data ?? {}) as Partial<ReminderData>;
      return {
        date: typeof at === "number" ? new Date(at) : null,
        title: request.content.title ?? request.identifier,
      };
    })
    .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
}
