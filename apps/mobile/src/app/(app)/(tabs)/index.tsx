import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Movie, TVShow } from "@moviewatchlist/shared";

import { PosterCard } from "@/components/poster-card";
import { getRegion } from "@/lib/profile";
import { tmdb } from "@/lib/tmdb";
import { useBrand } from "@/lib/theme";

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
  const { colors } = useBrand();
  const router = useRouter();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TVShow[]>([]);
  const [onTheAir, setOnTheAir] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);

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

        const [movies, playing, tv, air] = await Promise.all([
          tmdb.getTrendingMovies(),
          tmdb.getNowPlayingMovies(region),
          tmdb.getTrendingTV(),
          tmdb.getOnTheAirTV(region),
        ]);

        if (!active) return;
        setTrendingMovies(movies ?? []);
        setNowPlaying(playing ?? []);
        setTrendingTV(tv ?? []);
        setOnTheAir(air ?? []);
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
      <View className="px-4 py-3">
        <Text className="font-display text-3xl text-fg">Browse the aisles</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <Row
            data={trendingMovies}
            keyFor={(m) => String(m.id)}
            onPressItem={openMovie}
            posterFor={(m) => m.poster_path}
            title="Trending movies"
            titleFor={(m) => m.title}
          />
          <Row
            data={nowPlaying}
            keyFor={(m) => String(m.id)}
            onPressItem={openMovie}
            posterFor={(m) => m.poster_path}
            title="Now playing"
            titleFor={(m) => m.title}
          />
          <Row
            data={trendingTV}
            keyFor={(s) => String(s.id)}
            onPressItem={openTV}
            posterFor={(s) => s.poster_path}
            title="Trending TV"
            titleFor={(s) => s.name}
          />
          <Row
            data={onTheAir}
            keyFor={(s) => String(s.id)}
            onPressItem={openTV}
            posterFor={(s) => s.poster_path}
            title="On the air"
            titleFor={(s) => s.name}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
