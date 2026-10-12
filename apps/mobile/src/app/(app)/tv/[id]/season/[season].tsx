import { useCallback, useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TVEpisode, TVSeason } from "@moviewatchlist/shared";

import {
  getWatchedEpisodes,
  markEpisodeWatched,
  markSeasonWatched,
  syncShowWatchStatus,
  unmarkEpisodeWatched,
} from "@/lib/episodes";
import { tmdb } from "@/lib/tmdb";
import { useBrand } from "@/lib/theme";

export default function SeasonScreen() {
  const { colors } = useBrand();
  const { id, season } = useLocalSearchParams<{ id: string; season: string }>();
  const insets = useSafeAreaInsets();
  const showId = Number(id);
  const seasonNumber = Number(season);

  const [data, setData] = useState<TVSeason | null>(null);
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      tmdb.getTVSeason(id, season),
      getWatchedEpisodes(showId, seasonNumber),
    ]).then(([seasonResult, watchedNumbers]) => {
      if (!active) return;
      setData(seasonResult);
      setWatched(new Set(watchedNumbers));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id, season, seasonNumber, showId]);

  const toggle = useCallback(
    async (episodeNumber: number) => {
      const isWatched = watched.has(episodeNumber);

      // Optimistic update; revert on failure.
      setWatched((prev) => {
        const next = new Set(prev);
        if (isWatched) next.delete(episodeNumber);
        else next.add(episodeNumber);
        return next;
      });
      setPending((prev) => new Set(prev).add(episodeNumber));

      try {
        if (isWatched) {
          await unmarkEpisodeWatched(showId, seasonNumber, episodeNumber);
        } else {
          await markEpisodeWatched(showId, seasonNumber, episodeNumber);
        }
        // Reconcile the show's watchlist status from episode progress.
        // Best-effort: a sync failure must not revert the episode mark.
        try {
          await syncShowWatchStatus(showId);
        } catch (error) {
          console.warn("Could not sync show watch status", error);
        }
      } catch {
        setWatched((prev) => {
          const next = new Set(prev);
          if (isWatched) next.add(episodeNumber);
          else next.delete(episodeNumber);
          return next;
        });
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(episodeNumber);
          return next;
        });
      }
    },
    [seasonNumber, showId, watched],
  );

  const markAll = useCallback(async () => {
    if (!data) return;
    const episodeNumbers = data.episodes.map((e) => e.episode_number);
    if (episodeNumbers.length === 0) return;

    const previous = watched;
    setMarkingAll(true);
    // Optimistic: every episode in this season is now watched.
    setWatched(new Set([...previous, ...episodeNumbers]));

    try {
      await markSeasonWatched(showId, seasonNumber, episodeNumbers);
      try {
        await syncShowWatchStatus(showId);
      } catch (error) {
        console.warn("Could not sync show watch status", error);
      }
    } catch {
      setWatched(previous);
    } finally {
      setMarkingAll(false);
    }
  }, [data, seasonNumber, showId, watched]);

  const renderEpisode = useCallback(
    ({ item }: { item: TVEpisode }) => {
      const still = tmdb.imageUrl(item.still_path, "w300");
      const isWatched = watched.has(item.episode_number);
      const isPending = pending.has(item.episode_number);

      return (
        <View className="flex-row gap-3 px-4 py-3">
          <View className="h-16 w-28 overflow-hidden rounded-md bg-line">
            {still ? (
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                source={{ uri: still }}
                style={{ height: "100%", width: "100%" }}
              />
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-fg" numberOfLines={2}>
              {item.episode_number}. {item.name}
            </Text>
            {item.air_date ? (
              <Text className="mt-1 text-xs text-muted">{item.air_date}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={
              isWatched ? "Mark as unwatched" : "Mark as watched"
            }
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isWatched }}
            className="h-8 w-8 items-center justify-center self-center rounded-full border"
            disabled={isPending}
            onPress={() => toggle(item.episode_number)}
            style={{
              backgroundColor: isWatched ? colors.accent : "transparent",
              borderColor: isWatched ? colors.accent : colors.muted,
            }}
          >
            {isPending ? (
              <ActivityIndicator
                color={isWatched ? colors.bg : colors.primary}
              />
            ) : isWatched ? (
              <Text
                className="text-base font-bold"
                style={{ color: colors.bg }}
              >
                ✓
              </Text>
            ) : null}
          </Pressable>
        </View>
      );
    },
    [colors, pending, toggle, watched],
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Stack.Screen options={{ headerShown: true, title: "" }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Stack.Screen options={{ headerShown: true, title: "Not found" }} />
        <Text className="text-center text-muted">
          We couldn&apos;t load this season.
        </Text>
      </View>
    );
  }

  const allWatched =
    data.episodes.length > 0 &&
    data.episodes.every((e) => watched.has(e.episode_number));

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ headerShown: true, title: data.name }} />
      <FlatList
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        data={data.episodes}
        keyExtractor={(episode) => String(episode.id)}
        renderItem={renderEpisode}
      />

      {data.episodes.length > 0 ? (
        <View
          className="border-t border-line px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            className="items-center justify-center rounded-md py-3.5 active:opacity-80"
            disabled={allWatched || markingAll}
            onPress={markAll}
            style={{
              backgroundColor: allWatched ? colors.line : colors.primary,
            }}
          >
            {markingAll ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text
                className="text-base font-semibold"
                style={{ color: allWatched ? colors.muted : colors.onPrimary }}
              >
                {allWatched ? "All episodes watched" : "Mark all as watched"}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
