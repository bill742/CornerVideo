import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import {
  defaultFilmographyTab,
  type Filmography,
  filmographySize,
  type MediaCardItem,
  type MediaType,
  movieFilmography,
  type Person,
  tvFilmography,
} from "@moviewatchlist/shared";

import { MediaTabs } from "@/components/media-tabs";
import { PosterCard } from "@/components/poster-card";
import { tmdb } from "@/lib/tmdb";
import { VhsLoader } from "@/components/vhs-loader";

/** Lines of biography shown before "Read more". */
const BIO_LINES = 6;

const EMPTY_FILMOGRAPHY: Filmography = { acting: [], crew: [] };

function FilmographyRow({
  heading,
  items,
}: {
  heading: string;
  items: MediaCardItem[];
}) {
  const router = useRouter();

  return (
    <View className="mt-8">
      <Text className="mb-3 px-4 font-display text-2xl text-fg">{heading}</Text>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16 }}
        data={items}
        horizontal
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View className="mr-3">
            <PosterCard
              onPress={() =>
                router.push({
                  params: { id: String(item.id) },
                  pathname:
                    item.media_type === "movie" ? "/movie/[id]" : "/tv/[id]",
                })
              }
              posterPath={item.poster_path}
              title={item.title}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}
FilmographyRow.displayName = "FilmographyRow";

function Biography({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  return (
    <View className="mt-4">
      <Text
        className="text-base leading-6 text-fg"
        numberOfLines={expanded ? undefined : BIO_LINES}
        onTextLayout={(event) => {
          if (!expanded && event.nativeEvent.lines.length >= BIO_LINES) {
            setTruncated(true);
          }
        }}
      >
        {text}
      </Text>
      {truncated ? (
        <Pressable
          accessibilityRole="button"
          className="mt-2 self-start active:opacity-70"
          onPress={() => setExpanded((value) => !value)}
        >
          <Text className="text-sm font-semibold text-primary">
            {expanded ? "Show less" : "Read more"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
Biography.displayName = "Biography";

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [movies, setMovies] = useState<Filmography>(EMPTY_FILMOGRAPHY);
  const [tv, setTV] = useState<Filmography>(EMPTY_FILMOGRAPHY);
  const [activeTab, setActiveTab] = useState<MediaType>("movie");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      tmdb.getPerson(id),
      tmdb.getPersonMovieCredits(id),
      tmdb.getPersonTVCredits(id),
    ]).then(([personResult, movieCredits, tvCredits]) => {
      if (!active) return;
      const movieResult = movieCredits
        ? movieFilmography(movieCredits)
        : EMPTY_FILMOGRAPHY;
      const tvResult = tvCredits ? tvFilmography(tvCredits) : EMPTY_FILMOGRAPHY;
      setPerson(personResult);
      setMovies(movieResult);
      setTV(tvResult);
      setActiveTab(defaultFilmographyTab(movieResult, tvResult));
      setLoading(false);
    });
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

  if (!person) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Stack.Screen options={{ headerShown: true, title: "Not found" }} />
        <Text className="text-center text-muted">
          We couldn&apos;t load this person.
        </Text>
      </View>
    );
  }

  const photo = tmdb.imageUrl(person.profile_path, "w342");
  // With credits of only one kind there is nothing to switch between.
  const showTabs = filmographySize(movies) > 0 && filmographySize(tv) > 0;
  const { acting, crew } = activeTab === "movie" ? movies : tv;

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ headerShown: true, title: person.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row gap-4 px-4 pt-4">
          <View className="aspect-[2/3] w-32 overflow-hidden rounded-sm bg-line">
            {photo ? (
              <Image
                accessibilityLabel={person.name}
                cachePolicy="memory-disk"
                contentFit="cover"
                source={{ uri: photo }}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-2">
                <Text className="text-center text-xs text-muted">
                  No Image Available
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="font-display text-3xl text-fg">{person.name}</Text>
            {person.imdb_id ? (
              <Pressable
                accessibilityRole="link"
                className="mt-2 self-start active:opacity-70"
                onPress={() =>
                  WebBrowser.openBrowserAsync(
                    `https://www.imdb.com/name/${person.imdb_id}`,
                  )
                }
              >
                <Text className="text-sm font-semibold text-primary">
                  View on IMDb
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {person.biography ? (
          <View className="px-4">
            <Biography text={person.biography} />
          </View>
        ) : null}

        {showTabs ? (
          <View className="mt-8 px-4">
            <MediaTabs active={activeTab} onChange={setActiveTab} />
          </View>
        ) : null}

        {acting.length > 0 ? (
          <FilmographyRow heading="Acting" items={acting} />
        ) : null}

        {crew.map(([department, items]) => (
          <FilmographyRow heading={department} items={items} key={department} />
        ))}
      </ScrollView>
    </View>
  );
}
