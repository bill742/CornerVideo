import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BRAND, LANDING_STEPS } from "@moviewatchlist/shared";

import { useWelcome } from "@/lib/welcome";

/**
 * First launch while signed out: what Corner Video is, how it works, and a
 * way in. Shown until the person signs in or chooses to browse (root layout
 * guards it), so it never stands between a returning guest and Browse.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { markSeen } = useWelcome();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-8">
        <Text className="font-display text-lg uppercase tracking-widest text-primary">
          {BRAND.name}
        </Text>
        <Text
          accessibilityRole="header"
          className="mt-2 font-display text-4xl text-fg"
        >
          {BRAND.tagline}
        </Text>
        <Text className="mt-3 text-base text-muted">
          {BRAND.name} is a watchlist for movies and TV.
        </Text>

        <View className="mt-8 gap-5">
          {LANDING_STEPS.map((step, index) => (
            <View className="flex-row gap-4" key={step.title}>
              <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Text className="font-display text-base text-on-primary">
                  {index + 1}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-display text-lg text-fg">
                  {step.title}
                </Text>
                <Text className="mt-0.5 text-sm text-muted">{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          className="mt-10 items-center rounded-md bg-primary py-3 active:opacity-80"
          onPress={() => router.push("/signup")}
        >
          <Text className="text-base font-semibold text-on-primary">
            Create account
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="mt-3 items-center rounded-md border border-line py-3 active:opacity-80"
          onPress={() => router.push("/login")}
        >
          <Text className="text-base font-semibold text-fg">Sign in</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="mt-2 items-center py-3 active:opacity-80"
          onPress={markSeen}
        >
          <Text className="text-base font-semibold text-fg underline">
            Browse without an account
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
