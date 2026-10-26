import { useEffect } from "react";
import { Stack } from "expo-router";
import { AppState } from "react-native";

import { syncThemeFromProfile } from "@/lib/appearance";
import { useAuth } from "@/lib/auth-context";
import { syncReminders } from "@/lib/reminders";
import { useBrand } from "@/lib/theme";

export default function AppLayout() {
  const { colors } = useBrand();
  const { session } = useAuth();
  const userId = session?.user.id;

  // The profile's theme (possibly set on the web or another device) overrides
  // the device's copy. Keyed on the user rather than run once on mount: this
  // layout can mount for a moment before the signed-out redirect, and a sync
  // made then fails and would never be retried after sign-in.
  useEffect(() => {
    if (userId) syncThemeFromProfile();
  }, [userId]);

  // Scheduled reminders only know the dates TMDB had at the last sync, so
  // re-sync whenever the signed-in app opens or comes back to the foreground.
  useEffect(() => {
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
