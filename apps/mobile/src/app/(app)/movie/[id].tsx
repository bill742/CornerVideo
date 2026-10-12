import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import type { CastAndCrew, Movie } from "@moviewatchlist/shared";

import { WatchlistButton } from "@/components/watchlist-button";
import { tmdb } from "@/lib/tmdb";
import { useBrand } from "@/lib/theme";

function CastRow({ cast }: { cast: CastAndCrew[] }) {
  if (cast.length === 0) return null;
  return (
    <View className="mt-6">
      <Text className="mb-3 font-display text-xl text-fg">Cast</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {cast.slice(0, 15).map((person) => {
          const photo = tmdb.imageUrl(person.profile_path, "w185");
          return (
            <View
              className="mr-4 w-20"
              key={`${person.id}-${person.character}`}
            >
              <View className="h-20 w-20 overflow-hidden rounded-full bg-line">
                {photo ? (
                  <Image
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    source={{ uri: photo }}
                    style={{ height: "100%", width: "100%" }}
                  />
                ) : null}
              </View>
              <Text
                className="mt-2 text-center text-xs text-fg"
                numberOfLines={2}
              >
                {person.name}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function MovieDetailScreen() {
  const { colors } = useBrand();
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
      <View className="flex-1 items-center justify-center bg-bg">
        <Stack.Screen options={{ headerShown: true, title: "" }} />
        <ActivityIndicator color={colors.primary} />
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
