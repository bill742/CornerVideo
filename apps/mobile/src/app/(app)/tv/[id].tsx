import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { CastAndCrew, TVShow } from "@moviewatchlist/shared";

import { CastRow } from "@/components/cast-row";
import { WatchlistButton } from "@/components/watchlist-button";
import { tmdb } from "@/lib/tmdb";
import { VhsLoader } from "@/components/vhs-loader";

export default function TVDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [show, setShow] = useState<TVShow | null>(null);
  const [cast, setCast] = useState<CastAndCrew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([tmdb.getTVShow(id), tmdb.getTVCredits(id)]).then(
      ([showResult, credits]) => {
        if (!active) return;
        setShow(showResult);
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

  if (!show) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Stack.Screen options={{ headerShown: true, title: "Not found" }} />
        <Text className="text-center text-muted">
          We couldn&apos;t load this show.
        </Text>
      </View>
    );
  }

  const backdrop = tmdb.imageUrl(show.backdrop_path, "w780");
  const year = show.first_air_date ? show.first_air_date.slice(0, 4) : null;

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ headerShown: true, title: show.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {backdrop ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: backdrop }}
            style={{ aspectRatio: 16 / 9, width: "100%" }}
          />
        ) : null}

        <View className="px-4 pt-4">
          <Text className="font-display text-3xl text-fg">{show.name}</Text>
          <Text className="mt-1 text-sm text-muted">
            {[
              year,
              `${show.number_of_seasons} season${show.number_of_seasons === 1 ? "" : "s"}`,
              show.vote_average ? `★ ${show.vote_average.toFixed(1)}` : null,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>

          {show.genres?.length ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {show.genres.map((genre) => (
                <View className="rounded-full bg-line px-3 py-1" key={genre.id}>
                  <Text className="text-xs text-fg">{genre.name}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="mt-5">
            <WatchlistButton mediaType="tv" tmdbId={show.id} />
          </View>

          {show.overview ? (
            <Text className="mt-6 text-base leading-6 text-fg">
              {show.overview}
            </Text>
          ) : null}

          <CastRow cast={cast} />

          <Text className="mb-3 mt-8 font-display text-xl text-fg">
            Seasons
          </Text>
          {show.seasons.map((season) => {
            const poster = tmdb.imageUrl(season.poster_path, "w185");
            return (
              <Pressable
                className="mb-3 flex-row items-center gap-3 active:opacity-70"
                key={season.id}
                onPress={() =>
                  router.push({
                    params: { id, season: String(season.season_number) },
                    pathname: "/tv/[id]/season/[season]",
                  })
                }
              >
                <View className="h-20 w-14 overflow-hidden rounded-md bg-line">
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
                  <Text className="text-base font-semibold text-fg">
                    {season.name}
                  </Text>
                  <Text className="mt-1 text-xs text-muted">
                    {season.episode_count} episode
                    {season.episode_count === 1 ? "" : "s"}
                  </Text>
                </View>
                <Text className="text-xl text-muted">›</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
