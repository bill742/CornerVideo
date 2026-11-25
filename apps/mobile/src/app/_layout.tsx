import "../global.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { Oswald_600SemiBold, useFonts } from "@expo-google-fonts/oswald";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
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
import { SignInPromptProvider } from "@/lib/sign-in-prompt";
import { readWelcomeSeen, useWelcome, WelcomeProvider } from "@/lib/welcome";
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

/**
 * Signed-out people browse as guests: Browse, Search and the detail screens
 * work without an account, and anything that needs one opens the sign-in
 * prompt (`useSignInPrompt`).
 *
 * - `welcome` shows on first launch until they sign in or choose to browse
 *   (`Stack.Protected`, so `(app)` opens once it's seen).
 * - `(auth)` is a modal over the app or the welcome. Its layout dismisses it
 *   once there's a session, which drops the member back on the screen they
 *   came from. It isn't guarded on the session: a guard removes the modal
 *   while it's still presented, which left every touch in the app dead.
 */
function RootNavigator() {
  const { initializing, session } = useAuth();
  const router = useRouter();

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

  return (
    <SignInPromptProvider>
      <RootStack signedInAtLaunch={session !== null} />
    </SignInPromptProvider>
  );
}

function RootStack({ signedInAtLaunch }: { signedInAtLaunch: boolean }) {
  const { markSeen, seen } = useWelcome();
  // Read once: a member already signed in (say, from before the welcome
  // existed) never sees it. Signing in from the welcome marks it seen there.
  const [skipWelcome] = useState(signedInAtLaunch);
  const showWelcome = !seen && !skipWelcome;

  useEffect(() => {
    if (skipWelcome && !seen) markSeen();
  }, [markSeen, seen, skipWelcome]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={showWelcome}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={!showWelcome}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
    </Stack>
  );
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
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);
  // A font that fails to load falls back to the system face; don't strand the
  // user on the splash over it.
  const ready =
    (fontsLoaded || fontError !== null) &&
    themeRestored &&
    welcomeSeen !== null;

  // Apply the saved light/dark choice while the splash is still up, so the
  // first frame is already in the right scheme; likewise whether to open on
  // the welcome screen.
  useEffect(() => {
    restoreTheme().finally(() => setThemeRestored(true));
    readWelcomeSeen().then(setWelcomeSeen);
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <AuthProvider>
      <WelcomeProvider initialSeen={welcomeSeen}>
        <StatusBar style="auto" />
        <ThemeProvider value={navigationTheme}>
          <View className="flex-1 bg-bg" style={themeVars}>
            <RootNavigator />
          </View>
        </ThemeProvider>
      </WelcomeProvider>
    </AuthProvider>
  );
}
