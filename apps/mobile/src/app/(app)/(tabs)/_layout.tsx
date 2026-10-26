import { Tabs } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

import { useBrand } from "@/lib/theme";

/**
 * SF Symbols on iOS, Material Symbols on Android (expo-symbols bundles the
 * Material font, so these render offline and in release builds).
 */
function tabIcon(name: SymbolViewProps["name"]) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <SymbolView name={name} size={size} tintColor={color} />;
  }
  TabIcon.displayName = "TabIcon";
  return TabIcon;
}

export default function TabsLayout() {
  const { colors } = useBrand();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: tabIcon({ android: "movie", ios: "film" }),
          title: "Browse",
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: tabIcon({ android: "search", ios: "magnifyingglass" }),
          title: "Search",
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          tabBarIcon: tabIcon({ android: "shelves", ios: "books.vertical" }),
          title: "My Shelf",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: tabIcon({
            android: "badge",
            ios: "person.text.rectangle",
          }),
          title: "Membership",
        }}
      />
    </Tabs>
  );
}
