import { Tabs, useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

import { useAuth } from "@/lib/auth-context";
import { useSignInPrompt } from "@/lib/sign-in-prompt";
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
  const { session } = useAuth();
  const { runWithAccount } = useSignInPrompt();
  const router = useRouter();

  /**
   * My Shelf and Membership need an account: for a guest the tab opens the
   * sign-in prompt instead, and signing in from it lands on that tab.
   */
  function memberTab(href: "/profile" | "/watchlist") {
    return {
      tabPress: (event: { preventDefault: () => void }) => {
        if (session) return;
        event.preventDefault();
        runWithAccount(() => router.navigate(href));
      },
    };
  }

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
        listeners={memberTab("/watchlist")}
        name="watchlist"
        options={{
          tabBarIcon: tabIcon({ android: "shelves", ios: "books.vertical" }),
          title: "My Shelf",
        }}
      />
      <Tabs.Screen
        listeners={memberTab("/profile")}
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
