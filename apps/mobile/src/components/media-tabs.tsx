import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import type { MediaType } from "@moviewatchlist/shared";

import { useBrand } from "@/lib/theme";

const TABS: {
  icon: SymbolViewProps["name"];
  label: string;
  value: MediaType;
}[] = [
  { icon: { android: "movie", ios: "film" }, label: "Movies", value: "movie" },
  { icon: { android: "tv", ios: "tv" }, label: "TV Shows", value: "tv" },
];

/**
 * Movies / TV Shows switch, matching the web's pill toggle. Used by Browse
 * and the Cast and Crew screen.
 */
function MediaTabs({
  active,
  onChange,
}: {
  active: MediaType;
  onChange: (tab: MediaType) => void;
}) {
  const { colors } = useBrand();

  return (
    <View
      accessibilityRole="tablist"
      className="flex-row self-start rounded-sm border border-line bg-surface p-1"
    >
      {TABS.map((tab) => {
        const selected = tab.value === active;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`flex-row items-center gap-2 rounded-sm px-4 py-2 ${
              selected ? "bg-primary" : ""
            }`}
            key={tab.value}
            onPress={() => onChange(tab.value)}
          >
            <SymbolView
              name={tab.icon}
              size={16}
              tintColor={selected ? colors.onPrimary : colors.muted}
            />
            <Text
              className={`text-sm font-semibold ${
                selected ? "text-on-primary" : "text-muted"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
MediaTabs.displayName = "MediaTabs";

export { MediaTabs };
