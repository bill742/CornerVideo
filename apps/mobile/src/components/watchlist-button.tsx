import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import type { MediaType, WatchStatus } from "@moviewatchlist/shared";
import {
  WATCH_STATUS_LABELS,
  WATCH_STATUS_OPTIONS,
} from "@moviewatchlist/shared";

import { syncReminders } from "@/lib/reminders";
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

function WatchlistButton({ mediaType, tmdbId }: WatchlistButtonProps) {
  const { colors } = useBrand();
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getWatchlistStatus(tmdbId, mediaType)
      .then((next) => active && setStatus(next))
      .catch(() => active && setStatus(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mediaType, tmdbId]);

  async function onAdd() {
    setBusy(true);
    try {
      await addToWatchlist(tmdbId, mediaType);
      setStatus("want_to_watch");
      syncReminders();
    } finally {
      setBusy(false);
    }
  }

  async function onSelectStatus(next: WatchStatus) {
    setPickerOpen(false);
    setBusy(true);
    try {
      await updateWatchStatus(tmdbId, mediaType, next);
      setStatus(next);
      syncReminders();
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setPickerOpen(false);
    setBusy(true);
    try {
      await removeFromWatchlist(tmdbId, mediaType);
      setStatus(null);
      syncReminders();
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

  if (status === null) {
    return (
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
