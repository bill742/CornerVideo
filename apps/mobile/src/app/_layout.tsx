import "../global.css";

import { useEffect, useRef, useState } from "react";
import { Oswald_600SemiBold, useFonts } from "@expo-google-fonts/oswald";
import { Slot, useRouter, useSegments, type Href } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { reminderUrl } from "@/lib/reminders";
import { restoreTheme } from "@/lib/appearance";
import { useBrand } from "@/lib/theme";

// Hold the splash until the display font is in, so titles never flash in the
// system font first.
SplashScreen.preventAutoHideAsync();

// Show release reminders as a banner even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootNavigator() {
  const { initializing, session } = useAuth();
  const { colors } = useBrand();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/");
    }
  }, [initializing, router, segments, session]);

  // Tapping a release reminder opens that title. Covers a cold start too: the
  // hook reports a tap that launched the app. A tap made while signed out waits
  // here until sign-in completes.
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponse = useRef<string | null>(null);

  useEffect(() => {
    if (initializing || !session || !lastResponse) return;
    if (
      lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    const key = `${lastResponse.notification.request.identifier}@${lastResponse.notification.date}`;
    if (handledResponse.current === key) return;
    handledResponse.current = key;

    const url = reminderUrl(lastResponse);
    if (url) router.push(url as Href);
    // Otherwise a relaunch would replay the same tap.
    Notifications.clearLastNotificationResponse();
  }, [initializing, lastResponse, router, session]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const { themeVars } = useBrand();
  const [fontsLoaded, fontError] = useFonts({ Oswald_600SemiBold });
  const [themeRestored, setThemeRestored] = useState(false);
  // A font that fails to load falls back to the system face; don't strand the
  // user on the splash over it.
  const ready = (fontsLoaded || fontError !== null) && themeRestored;

  // Apply the saved light/dark choice while the splash is still up, so the
  // first frame is already in the right scheme.
  useEffect(() => {
    restoreTheme().finally(() => setThemeRestored(true));
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <View className="flex-1 bg-bg" style={themeVars}>
        <RootNavigator />
      </View>
    </AuthProvider>
  );
}
