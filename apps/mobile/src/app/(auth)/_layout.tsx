import { useEffect, useRef } from "react";
import { Stack, useNavigation, useRouter } from "expo-router";
import { Keyboard, Pressable, Text } from "react-native";

import { useAuth } from "@/lib/auth-context";
import { useSignInPrompt } from "@/lib/sign-in-prompt";
import { useBrand } from "@/lib/theme";

/**
 * Sign-in, sign-up and password reset, presented as a modal over the guest
 * app or the welcome screen (root layout). A session closes it on its own.
 */
export default function AuthLayout() {
  const { colors } = useBrand();
  const { session } = useAuth();
  const { cancelPendingIfSignedOut } = useSignInPrompt();
  // In a layout, this is the root stack's navigation for the whole group.
  const navigation = useNavigation();
  const router = useRouter();

  // Closing without signing in abandons whatever the guest was trying to do.
  useEffect(() => cancelPendingIfSignedOut, [cancelPendingIfSignedOut]);

  function close() {
    if (navigation.canGoBack()) navigation.goBack();
    else router.replace("/");
  }

  // Signed in (or opened by a link while signed in): dismiss the modal the
  // normal way, keyboard first, so the screen underneath gets touches back.
  // Once only: the effect re-runs while the modal animates away, and a second
  // goBack pops the screen the member came from as well.
  const signedIn = session !== null;
  const dismissed = useRef(false);
  useEffect(() => {
    if (!signedIn || dismissed.current) return;
    dismissed.current = true;
    Keyboard.dismiss();
    if (navigation.canGoBack()) navigation.goBack();
    else router.replace("/");
  }, [navigation, router, signedIn]);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerBackTitle: "Back",
        headerRight: () => (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={close}>
            <Text className="text-base font-semibold text-primary">Close</Text>
          </Pressable>
        ),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitle: "",
      }}
    />
  );
}
