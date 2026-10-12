import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BRAND, REGIONS } from "@moviewatchlist/shared";

import { AppearanceSetting } from "@/components/appearance-setting";
import { ReleaseRemindersSetting } from "@/components/release-reminders-setting";
import { ReminderDevTools } from "@/components/reminder-dev-tools";
import { useAuth } from "@/lib/auth-context";
import { getRegion, updateRegion } from "@/lib/profile";
import { useBrand } from "@/lib/theme";

export default function ProfileScreen() {
  const { colors } = useBrand();
  const { session, signOut } = useAuth();
  const [region, setRegion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getRegion().then((saved) => {
        if (active) setRegion(saved);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  async function selectRegion(code: string) {
    const previous = region;
    setRegion(code);
    setSaving(true);
    setError(null);

    try {
      await updateRegion(code);
    } catch {
      // Put the old value back rather than leaving the UI claiming a
      // preference the server never accepted.
      setRegion(previous);
      setError("Could not save your region. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-4 py-3">
        <Text className="font-display text-3xl text-fg">Membership</Text>
      </View>

      <ScrollView contentContainerClassName="px-4 pb-8">
        <View
          accessibilityLabel="Your membership card"
          className="overflow-hidden rounded-md border border-line bg-surface"
        >
          <View className="flex-row items-center bg-primary px-4 py-3">
            <Text className="font-display text-lg uppercase tracking-wide text-on-primary">
              {BRAND.name}
            </Text>
            <Text className="ml-auto text-sm font-semibold text-on-primary">
              Member
            </Text>
          </View>
          <View className="px-4 py-3">
            <Text className="text-sm text-muted">Card holder</Text>
            <Text className="mt-0.5 text-base font-semibold text-fg">
              {session?.user.email ?? "—"}
            </Text>
          </View>
        </View>

        <Text className="mt-8 text-xs uppercase tracking-wide text-muted">
          Region
        </Text>
        <Text className="mt-1 text-sm text-muted">
          Filters now playing and currently airing releases. Shared with the web
          app.
        </Text>

        {region === null ? (
          <ActivityIndicator className="mt-4" color={colors.primary} />
        ) : (
          <View className="mt-3 overflow-hidden rounded-md border border-line">
            {REGIONS.map((option, index) => {
              const selected = option.code === region;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className={`flex-row items-center gap-3 px-4 py-3 ${
                    index > 0 ? "border-t border-line" : ""
                  } ${selected ? "bg-line" : ""}`}
                  disabled={saving}
                  key={option.code}
                  onPress={() => selectRegion(option.code)}
                >
                  <Text className="text-lg">{option.flag}</Text>
                  <Text className="flex-1 text-base text-fg">
                    {option.label}
                  </Text>
                  {selected && (
                    <Text className="text-sm font-semibold text-fg">✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {error && <Text className="mt-3 text-sm text-primary">{error}</Text>}

        <Text className="mt-8 text-xs uppercase tracking-wide text-muted">
          Theme
        </Text>
        <Text className="mt-1 text-sm text-muted">
          Shared with the web app.
        </Text>
        <AppearanceSetting />

        <Text className="mt-8 text-xs uppercase tracking-wide text-muted">
          Notifications
        </Text>
        <ReleaseRemindersSetting />
        {__DEV__ && <ReminderDevTools />}

        <Pressable
          className="mt-10 items-center rounded-md border border-line px-4 py-3"
          onPress={() => signOut()}
        >
          <Text className="text-base font-semibold text-fg">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
