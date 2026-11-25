import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FREE_WATCHLIST_LIMIT } from "@moviewatchlist/shared";

interface SignInPromptPanelProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
  /** Shown as a "Not now" button when given (the sheet); the tab panel has none. */
  onDismiss?: () => void;
}

/**
 * What a guest sees when they reach for something that needs an account: a
 * shelf, Membership, or any write. Plain copy, as for all sign-in screens.
 */
function SignInPromptPanel({
  onCreateAccount,
  onDismiss,
  onSignIn,
}: SignInPromptPanelProps) {
  return (
    <View>
      <Text
        accessibilityRole="header"
        className="font-display text-2xl text-fg"
      >
        Create a free account to keep a shelf
      </Text>
      <Text className="mt-2 text-base text-muted">
        Your first {FREE_WATCHLIST_LIMIT} titles are free. You can keep browsing
        without one.
      </Text>

      <Pressable
        accessibilityRole="button"
        className="mt-6 items-center rounded-md bg-primary py-3 active:opacity-80"
        onPress={onCreateAccount}
      >
        <Text className="text-base font-semibold text-on-primary">
          Create account
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        className="mt-3 items-center rounded-md border border-line py-3 active:opacity-80"
        onPress={onSignIn}
      >
        <Text className="text-base font-semibold text-fg">Sign in</Text>
      </Pressable>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          className="mt-2 items-center py-3 active:opacity-80"
          onPress={onDismiss}
        >
          <Text className="text-base text-muted">Not now</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
SignInPromptPanel.displayName = "SignInPromptPanel";

/**
 * My Shelf and Membership for a guest. The tab bar normally opens the sign-in
 * prompt instead of these tabs, so this shows only when a guest lands here
 * another way: a link, or signing out while on the tab.
 */
function GuestTab({ title }: { title: string }) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Text className="px-4 py-3 font-display text-3xl text-fg">{title}</Text>
      <View className="px-6 pt-6">
        <SignInPromptPanel
          onCreateAccount={() => router.push("/signup")}
          onSignIn={() => router.push("/login")}
        />
      </View>
    </SafeAreaView>
  );
}
GuestTab.displayName = "GuestTab";

export { GuestTab, SignInPromptPanel };
