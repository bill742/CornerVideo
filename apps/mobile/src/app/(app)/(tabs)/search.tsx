import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MultiSearchItem } from "@moviewatchlist/shared";

import { PosterCard } from "@/components/poster-card";
import { tmdb } from "@/lib/tmdb";
import { useBrand } from "@/lib/theme";

const NUM_COLUMNS = 3;

// Pad to a full final row so the last item keeps its column width instead of
// stretching across the row (flex-1 + numColumns leaves a short row stretched).
function padToColumns(items: MultiSearchItem[]): (MultiSearchItem | null)[] {
  const remainder = items.length % NUM_COLUMNS;
  if (remainder === 0) return items;
  return [...items, ...Array(NUM_COLUMNS - remainder).fill(null)];
}

export default function SearchScreen() {
  const { colors } = useBrand();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<MultiSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const query = term.trim();
    const id = ++requestId.current;

    const handle = setTimeout(async () => {
      if (id !== requestId.current) return;
      if (query.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const found = await tmdb.multiSearch(query);
      // Ignore stale responses from earlier keystrokes.
      if (id !== requestId.current) return;
      setResults(found ?? []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(handle);
  }, [term]);

  function openItem(item: MultiSearchItem) {
    const pathname = item.media_type === "tv" ? "/tv/[id]" : "/movie/[id]";
    router.push({ params: { id: String(item.id) }, pathname });
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-4 py-3">
        <Text className="mb-3 font-display text-3xl text-fg">Search</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          className="rounded-md bg-surface px-4 py-3 text-fg"
          clearButtonMode="while-editing"
          onChangeText={setTerm}
          placeholder="Movies and TV shows"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          value={term}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 16, paddingBottom: 24, paddingTop: 8 }}
          data={padToColumns(results)}
          keyExtractor={(item, index) =>
            item ? `${item.media_type}-${item.id}` : `placeholder-${index}`
          }
          ListEmptyComponent={
            term.trim().length >= 2 ? (
              <Text className="px-4 text-muted">No results.</Text>
            ) : null
          }
          numColumns={NUM_COLUMNS}
          renderItem={({ item }) =>
            item ? (
              <PosterCard
                onPress={() => openItem(item)}
                posterPath={item.poster_path}
                title={item.title ?? item.name ?? "Untitled"}
                widthClassName="flex-1"
              />
            ) : (
              <View className="flex-1" />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
