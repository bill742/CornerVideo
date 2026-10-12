import { Tabs } from "expo-router";

import { useBrand } from "@/lib/theme";

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
      <Tabs.Screen name="index" options={{ title: "Browse" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="watchlist" options={{ title: "My Shelf" }} />
      <Tabs.Screen name="profile" options={{ title: "Membership" }} />
    </Tabs>
  );
}
