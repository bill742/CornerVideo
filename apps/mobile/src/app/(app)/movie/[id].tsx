import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";
import type { CastAndCrew, Movie } from "@moviewatchlist/shared";

import { CastRow } from "@/components/cast-row";
import { WatchlistButton } from "@/components/watchlist-button";
import { tmdb } from "@/lib/tmdb";
import { VhsLoader } from "@/components/vhs-loader";

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<CastAndCrew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([tmdb.getMovie(id), tmdb.getMovieCredits(id)]).then(
      ([movieResult, credits]) => {
        if (!active) return;
        setMovie(movieResult);
        setCast(credits?.cast ?? []);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg">
        <Stack.Screen options={{ headerShown: true, title: "" }} />
        <VhsLoader />
      </View>
    );
  }

  if (!movie) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Stack.Screen options={{ headerShown: true, title: "Not found" }} />
        <Text className="text-center text-muted">
          We couldn&apos;t load this movie.
        </Text>
      </View>
    );
  }

  const backdrop = tmdb.imageUrl(movie.backdrop_path, "w780");
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ headerShown: true, title: movie.title }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        {backdrop ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: backdrop }}
            style={{ aspectRatio: 16 / 9, width: "100%" }}
          />
        ) : null}

        <View className="flex-1 px-4 pt-4">
          <Text className="font-display text-3xl text-fg">{movie.title}</Text>
          <Text className="mt-1 text-sm text-muted">
            {[
              year,
              movie.runtime ? `${movie.runtime} min` : null,
              movie.vote_average ? `★ ${movie.vote_average.toFixed(1)}` : null,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>

          {movie.genres?.length ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <View className="rounded-full bg-line px-3 py-1" key={genre.id}>
                  <Text className="text-xs text-fg">{genre.name}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="mt-5">
            <WatchlistButton mediaType="movie" tmdbId={movie.id} />
          </View>

          {movie.overview ? (
            <Text className="mt-6 text-base leading-6 text-fg">
              {movie.overview}
            </Text>
          ) : null}

          <View className="flex-1" />

          <CastRow cast={cast} />
        </View>
      </ScrollView>
    </View>
  );
}
