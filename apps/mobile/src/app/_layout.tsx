import "../global.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { Oswald_600SemiBold, useFonts } from "@expo-google-fonts/oswald";
import {
  DarkTheme,
  DefaultTheme,
  Slot,
  ThemeProvider,
  useRouter,
  useSegments,
  type Href,
} from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { reminderUrl } from "@/lib/reminders";
import { restoreTheme } from "@/lib/appearance";
import { useBrand } from "@/lib/theme";
import { VhsLoader } from "@/components/vhs-loader";

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
      <View className="flex-1 bg-bg">
        <VhsLoader />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const { colors, scheme, themeVars } = useBrand();

  // React Navigation paints its own containers (the stack behind a pushed
  // screen, the tab scene) from its theme. Left on its light default, they
  // showed as a light flash during screen transitions in dark mode.
  const navigationTheme = useMemo(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.bg,
        border: colors.line,
        card: colors.bg,
        notification: colors.primary,
        primary: colors.primary,
        text: colors.text,
      },
    };
  }, [colors, scheme]);

  // The native window behind every screen defaults to white; match it to the
  // theme so nothing light shows through during a transition.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);
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
      <ThemeProvider value={navigationTheme}>
        <View className="flex-1 bg-bg" style={themeVars}>
          <RootNavigator />
        </View>
      </ThemeProvider>
    </AuthProvider>
  );
}
