import { useEffect } from "react";
import { Stack, useNavigation, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { useSignInPrompt } from "@/lib/sign-in-prompt";
import { useBrand } from "@/lib/theme";

/**
 * Sign-in, sign-up and password reset, presented as a modal over the guest
 * app or the welcome screen (root layout). A session closes it on its own.
 */
export default function AuthLayout() {
  const { colors } = useBrand();
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
