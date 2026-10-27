import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { CastAndCrew } from "@moviewatchlist/shared";

import { tmdb } from "@/lib/tmdb";

/** Top-billed only; the full cast is a long tail of bit parts. */
const CAST_LIMIT = 15;

function CastRow({ cast }: { cast: CastAndCrew[] }) {
  const router = useRouter();

  if (cast.length === 0) return null;

  return (
    <View className="mt-6">
      <Text className="mb-3 font-display text-xl text-fg">Cast</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {cast.slice(0, CAST_LIMIT).map((person) => {
          const photo = tmdb.imageUrl(person.profile_path, "w185");
          return (
            <Pressable
              accessibilityRole="link"
              className="mr-4 w-20 active:opacity-70"
              key={`${person.id}-${person.character}`}
              onPress={() =>
                router.push({
                  params: { id: String(person.id) },
                  pathname: "/cast-and-crew/[id]",
                })
              }
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
              {person.character ? (
                <Text
                  className="mt-0.5 text-center text-xs text-muted"
                  numberOfLines={2}
                >
                  {person.character}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
CastRow.displayName = "CastRow";

export { CastRow };
