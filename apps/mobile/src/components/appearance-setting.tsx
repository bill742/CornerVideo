import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { THEME_OPTIONS, type Theme } from "@moviewatchlist/shared";

import { getTheme, updateTheme } from "@/lib/appearance";
import { useBrand } from "@/lib/theme";

function AppearanceSetting() {
  const { colors } = useBrand();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-read on focus: the launch sync can replace the device's copy with a
  // preference saved on the web after this screen first mounted.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getTheme().then((saved) => active && setTheme(saved));
      return () => {
        active = false;
      };
    }, []),
  );

  async function select(next: Theme) {
    const previous = theme;
    setTheme(next);
    setSaving(true);
    setError(null);

    try {
      await updateTheme(next);
    } catch {
      setTheme(previous);
      setError("Could not save your theme. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (theme === null) {
    return <ActivityIndicator className="mt-4" color={colors.primary} />;
  }

  return (
    <View>
      <View
        accessibilityRole="radiogroup"
        className="mt-3 overflow-hidden rounded-md border border-line"
      >
        {THEME_OPTIONS.map((option, index) => {
          const selected = option.value === theme;

          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`flex-row items-center gap-3 px-4 py-3 ${
                index > 0 ? "border-t border-line" : ""
              } ${selected ? "bg-line" : ""}`}
              disabled={saving}
              key={option.value}
              onPress={() => select(option.value)}
            >
              <Text className="flex-1 text-base text-fg">{option.label}</Text>
              {selected && (
                <Text className="text-sm font-semibold text-fg">✓</Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {error && <Text className="mt-3 text-sm text-primary">{error}</Text>}
    </View>
  );
}
AppearanceSetting.displayName = "AppearanceSetting";

export { AppearanceSetting };
