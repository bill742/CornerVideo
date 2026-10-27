import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MediaType, Movie, TVShow } from "@moviewatchlist/shared";

import { MediaTabs } from "@/components/media-tabs";
import { PosterCard } from "@/components/poster-card";
import { getRegion } from "@/lib/profile";
import { tmdb } from "@/lib/tmdb";
import { VhsLoader } from "@/components/vhs-loader";

function Row<T>({
  data,
  keyFor,
  posterFor,
  titleFor,
  onPressItem,
  title,
}: {
  data: T[];
  keyFor: (item: T) => string;
  posterFor: (item: T) => string | null;
  titleFor: (item: T) => string;
  onPressItem: (item: T) => void;
  title: string;
}) {
  if (data.length === 0) return null;

  return (
    <View className="mb-6">
      <Text className="mb-3 px-4 font-display text-2xl text-fg">{title}</Text>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16 }}
        data={data}
        horizontal
        keyExtractor={keyFor}
        renderItem={({ item }) => (
          <View className="mr-3">
            <PosterCard
              onPress={() => onPressItem(item)}
              posterPath={posterFor(item)}
              title={titleFor(item)}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const [inTheatres, setInTheatres] = useState<Movie[]>([]);
  const [newOnDigital, setNewOnDigital] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TVShow[]>([]);
  const [onTheAir, setOnTheAir] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MediaType>("movie");

  // Region is cached in memory, so on most focuses this resolves without any
  // I/O and the early return means no TMDB requests either. Changing it in
  // Profile updates the cache, which is what makes this refetch.
  const loadedRegion = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const region = await getRegion();
        if (!active || loadedRegion.current === region) return;

        // Same rows, sources and 12-title cap as the web home page.
        const [releases, upcoming, tv, air] = await Promise.all([
          tmdb.getReleaseRows(region),
          tmdb.getUpcomingMovies(region),
          tmdb.getTrendingTV(),
          tmdb.getOnTheAirTV(region),
        ]);

        if (!active) return;
        setInTheatres((releases?.theatrical ?? []).slice(0, 12));
        setNewOnDigital((releases?.digital ?? []).slice(0, 12));
        setComingSoon((upcoming ?? []).slice(0, 12));
        setTrendingTV((tv ?? []).slice(0, 12));
        setOnTheAir((air ?? []).slice(0, 12));
        setLoading(false);
        loadedRegion.current = region;
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  function openMovie(movie: Movie) {
    router.push({ params: { id: String(movie.id) }, pathname: "/movie/[id]" });
  }

  function openTV(show: TVShow) {
    router.push({ params: { id: String(show.id) }, pathname: "/tv/[id]" });
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="gap-3 px-4 py-3">
        <Text className="font-display text-3xl text-fg">Browse the aisles</Text>
        <MediaTabs active={activeTab} onChange={setActiveTab} />
      </View>

      {loading ? (
        <VhsLoader />
      ) : (
        <ScrollView
          className="flex-1"
          // A fresh list per tab, so switching starts at the top.
          key={activeTab}
          contentContainerStyle={{ paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "movie" ? (
            <>
              <Row
                data={inTheatres}
                keyFor={(m) => String(m.id)}
                onPressItem={openMovie}
                posterFor={(m) => m.poster_path}
                title="In Theatres"
                titleFor={(m) => m.title}
              />
              <Row
                data={newOnDigital}
                keyFor={(m) => String(m.id)}
                onPressItem={openMovie}
                posterFor={(m) => m.poster_path}
                title="New on Digital"
                titleFor={(m) => m.title}
              />
              <Row
                data={comingSoon}
                keyFor={(m) => String(m.id)}
                onPressItem={openMovie}
                posterFor={(m) => m.poster_path}
                title="Coming Soon"
                titleFor={(m) => m.title}
              />
            </>
          ) : (
            <>
              <Row
                data={trendingTV}
                keyFor={(s) => String(s.id)}
                onPressItem={openTV}
                posterFor={(s) => s.poster_path}
                title="Trending This Week"
                titleFor={(s) => s.name}
              />
              <Row
                data={onTheAir}
                keyFor={(s) => String(s.id)}
                onPressItem={openTV}
                posterFor={(s) => s.poster_path}
                title="Currently Airing"
                titleFor={(s) => s.name}
              />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
