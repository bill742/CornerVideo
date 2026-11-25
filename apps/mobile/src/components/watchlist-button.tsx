import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import type { MediaType, WatchStatus } from "@moviewatchlist/shared";
import {
  WATCH_STATUS_LABELS,
  WATCH_STATUS_OPTIONS,
} from "@moviewatchlist/shared";

import { useAuth } from "@/lib/auth-context";
import {
  answerAlertsOffer,
  shouldOfferAlerts,
  syncReminders,
} from "@/lib/reminders";
import { useSignInPrompt } from "@/lib/sign-in-prompt";
import {
  addToWatchlist,
  getWatchlistStatus,
  removeFromWatchlist,
  updateWatchStatus,
} from "@/lib/watchlist";
import { useBrand } from "@/lib/theme";

interface WatchlistButtonProps {
  tmdbId: number;
  mediaType: MediaType;
}

/**
 * After the first add of a title with a release still to come, offer New
 * release alerts to a Premium member who hasn't chosen yet. This is where the
 * notification permission is first asked for (besides the Membership switch),
 * so the system prompt follows a reason the member can see.
 */
async function offerAlerts(tmdbId: number, mediaType: MediaType) {
  const offer = await shouldOfferAlerts(tmdbId, mediaType);
  if (!offer) return;
  Alert.alert(
    "Turn on New release alerts?",
    `Get a notification at 9am on the day ${offer.title} comes out.`,
    [
      {
        onPress: () => answerAlertsOffer(false),
        style: "cancel",
        text: "Not now",
      },
      { onPress: () => answerAlertsOffer(true), text: "Turn on" },
    ],
  );
}

function WatchlistButton({ mediaType, tmdbId }: WatchlistButtonProps) {
  const { colors } = useBrand();
  const { session } = useAuth();
  const { runWithAccount } = useSignInPrompt();
  const userId = session?.user.id ?? null;
  // Bumped by every write, so a status read that started before one can't
  // overwrite its result (sign-in reloads the status while the add it
  // resumes is in flight).
  const writes = useRef(0);
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-read when the member changes: signing in may reveal the title is
  // already on their shelf, and signing out empties it.
  useEffect(() => {
    let active = true;
    const startedAt = writes.current;
    getWatchlistStatus(tmdbId, mediaType)
      .then((next) => active && writes.current === startedAt && setStatus(next))
      .catch(() => active && writes.current === startedAt && setStatus(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mediaType, tmdbId, userId]);

  /**
   * Adds the title. Also the action resumed after a guest signs in from the
   * prompt, when the account may already have it shelved: keep that status
   * rather than resetting it to "Want to watch".
   */
  async function add() {
    writes.current += 1;
    setBusy(true);
    setError(null);
    try {
      const existing = await getWatchlistStatus(tmdbId, mediaType);
      if (existing) {
        setStatus(existing);
        return;
      }
      await addToWatchlist(tmdbId, mediaType);
      setStatus("want_to_watch");
      syncReminders();
      offerAlerts(tmdbId, mediaType);
    } catch (actionError) {
      // Say why (e.g. the free-tier limit) rather than failing silently.
      // Status only changes after a successful write, so it's still accurate.
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not update your shelf. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function onAdd() {
    runWithAccount(add);
  }

  async function onSelectStatus(next: WatchStatus) {
    writes.current += 1;
    setPickerOpen(false);
    setBusy(true);
    setError(null);
    try {
      await updateWatchStatus(tmdbId, mediaType, next);
      setStatus(next);
      syncReminders();
    } catch (actionError) {
      // Say why (e.g. the free-tier limit) rather than failing silently.
      // Status only changes after a successful write, so it's still accurate.
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not update your shelf. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    writes.current += 1;
    setPickerOpen(false);
    setBusy(true);
    setError(null);
    try {
      await removeFromWatchlist(tmdbId, mediaType);
      setStatus(null);
      syncReminders();
    } catch (actionError) {
      // Say why (e.g. the free-tier limit) rather than failing silently.
      // Status only changes after a successful write, so it's still accurate.
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not update your shelf. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View className="h-12 items-center justify-center rounded-md bg-surface">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const errorText = error ? (
    <Text className="mt-2 text-sm text-primary">{error}</Text>
  ) : null;

  if (status === null) {
    return (
      <>
        <Pressable
          accessibilityRole="button"
          className="h-12 items-center justify-center rounded-md bg-primary active:opacity-80"
          disabled={busy}
          onPress={onAdd}
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text className="text-base font-semibold text-on-primary">
              Add to shelf
            </Text>
          )}
        </Pressable>
        {errorText}
      </>
    );
  }

  return (
    <>
      <Pressable
        className="h-12 flex-row items-center justify-center gap-2 rounded-md border border-line bg-surface active:opacity-80"
        disabled={busy}
        onPress={() => setPickerOpen(true)}
      >
        {busy ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text className="text-base font-semibold text-fg">
            {WATCH_STATUS_LABELS[status]}
          </Text>
        )}
      </Pressable>
      {errorText}

      <Modal
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
        transparent
        visible={pickerOpen}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setPickerOpen(false)}
        >
          <View className="rounded-t-3xl bg-surface px-4 pb-10 pt-3">
            <View className="mb-3 self-center h-1 w-10 rounded-full bg-line" />
            {WATCH_STATUS_OPTIONS.map((option) => (
              <Pressable
                className="flex-row items-center justify-between rounded-md px-4 py-4 active:bg-line"
                key={option}
                onPress={() => onSelectStatus(option)}
              >
                <Text className="text-base text-fg">
                  {WATCH_STATUS_LABELS[option]}
                </Text>
                {status === option ? (
                  <Text className="text-base text-fg">✓</Text>
                ) : null}
              </Pressable>
            ))}
            <Pressable
              className="mt-1 rounded-md px-4 py-4 active:bg-line"
              onPress={onRemove}
            >
              <Text className="text-base text-primary">Remove from shelf</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
WatchlistButton.displayName = "WatchlistButton";

export { WatchlistButton };
