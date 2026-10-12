import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MediaType, WatchStatus } from "@moviewatchlist/shared";
import {
  WATCH_STATUS_LABELS,
  WATCH_STATUS_OPTIONS,
} from "@moviewatchlist/shared";

import { tmdb } from "@/lib/tmdb";
import { getWatchlist } from "@/lib/watchlist";
import { useBrand } from "@/lib/theme";

interface ResolvedItem {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  status: WatchStatus;
}

type StatusFilter = WatchStatus | "all";

const MEDIA_TABS: { label: string; value: MediaType }[] = [
  { label: "Movies", value: "movie" },
  { label: "TV Shows", value: "tv" },
];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  ...WATCH_STATUS_OPTIONS.map((status) => ({
    label: WATCH_STATUS_LABELS[status],
    value: status,
  })),
];

async function resolveWatchlist(): Promise<ResolvedItem[]> {
  const items = await getWatchlist();
  const resolved = await Promise.all(
    items.map(async (item) => {
      const details =
        item.media_type === "tv"
          ? await tmdb.getTVShow(item.tmdb_id)
          : await tmdb.getMovie(item.tmdb_id);
      if (!details) return null;
      const title =
        item.media_type === "tv"
          ? (details as { name: string }).name
          : (details as { title: string }).title;
      return {
        id: item.id,
        mediaType: item.media_type,
        posterPath: details.poster_path,
        status: item.status,
        title,
        tmdbId: item.tmdb_id,
      } satisfies ResolvedItem;
    }),
  );
  return resolved.filter((entry): entry is ResolvedItem => entry !== null);
}

export default function WatchlistScreen() {
  const { colors } = useBrand();
  const router = useRouter();
  const [items, setItems] = useState<ResolvedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mediaTab, setMediaTab] = useState<MediaType>("movie");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const load = useCallback(async () => {
    try {
      setItems(await resolveWatchlist());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const mediaItems = useMemo(
    () => items.filter((item) => item.mediaType === mediaTab),
    [items, mediaTab],
  );

  const visibleItems = useMemo(
    () =>
      statusFilter === "all"
        ? mediaItems
        : mediaItems.filter((item) => item.status === statusFilter),
    [mediaItems, statusFilter],
  );

  function openItem(item: ResolvedItem) {
    const pathname = item.mediaType === "tv" ? "/tv/[id]" : "/movie/[id]";
    router.push({ params: { id: String(item.tmdbId) }, pathname });
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Text className="px-4 py-3 font-display text-3xl text-fg">My Shelf</Text>

      <View className="mx-4 mb-3 flex-row rounded-md bg-surface p-1">
        {MEDIA_TABS.map((tab) => {
          const active = tab.value === mediaTab;
          return (
            <Pressable
              className="flex-1 items-center rounded-md py-2"
              key={tab.value}
              onPress={() => setMediaTab(tab.value)}
              style={{
                backgroundColor: active ? colors.primary : "transparent",
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: active ? colors.onPrimary : colors.muted }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-2">
        <ScrollView
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {STATUS_FILTERS.map((filter) => {
            const active = filter.value === statusFilter;
            return (
              <Pressable
                className="rounded-full px-3 py-1.5"
                key={filter.value}
                onPress={() => setStatusFilter(filter.value)}
                style={{
                  backgroundColor: active ? colors.primary : colors.line,
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: active ? colors.onPrimary : colors.text }}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 12 }}
          data={visibleItems}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="items-center px-6 py-20">
              {items.length === 0 ? (
                <>
                  <Text className="mb-2 text-lg font-semibold text-fg">
                    Your shelf is empty
                  </Text>
                  <Text className="text-center text-sm text-muted">
                    Add movies and shows from any title, and they&apos;ll wait
                    here with their premiere dates.
                  </Text>
                </>
              ) : (
                <Text className="text-center text-sm text-muted">
                  No {mediaTab === "tv" ? "shows" : "movies"}
                  {statusFilter === "all"
                    ? ""
                    : ` marked "${WATCH_STATUS_LABELS[statusFilter]}"`}
                  .
                </Text>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              refreshing={refreshing}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const poster = tmdb.imageUrl(item.posterPath, "w185");
            return (
              <Pressable
                className="flex-row items-center gap-3 px-4 py-3 active:opacity-70"
                onPress={() => openItem(item)}
              >
                <View className="h-24 w-16 overflow-hidden rounded-md bg-line">
                  {poster ? (
                    <Image
                      cachePolicy="memory-disk"
                      contentFit="cover"
                      source={{ uri: poster }}
                      style={{ height: "100%", width: "100%" }}
                    />
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-semibold text-fg"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View className="mt-2 self-start rounded-full bg-line px-2 py-1">
                    <Text className="text-xs text-fg">
                      {WATCH_STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
