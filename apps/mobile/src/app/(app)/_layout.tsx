import { useEffect } from "react";
import { Stack } from "expo-router";
import { AppState } from "react-native";

import { syncThemeFromProfile } from "@/lib/appearance";
import { syncReminders } from "@/lib/reminders";
import { useBrand } from "@/lib/theme";

export default function AppLayout() {
  const { colors } = useBrand();

  // Scheduled reminders only know the dates TMDB had at the last sync, so
  // re-sync whenever the signed-in app opens or comes back to the foreground.
  useEffect(() => {
    // Signed in from here on, so the profile's theme (possibly set on the web
    // or another device) can override the device's copy.
    syncThemeFromProfile();
    syncReminders();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") syncReminders();
    });
    return () => subscription.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerBackTitle: "Back",
        headerShadowVisible: false,
        headerShown: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.text,
          fontFamily: "Oswald_600SemiBold",
        },
      }}
    />
  );
}
