import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";

import { isPremium } from "@/lib/premium";
import {
  getRemindersEnabled,
  getReminderPermission,
  requestReminderPermission,
  setRemindersEnabled,
  syncReminders,
} from "@/lib/reminders";
import { useBrand } from "@/lib/theme";

interface ReminderState {
  denied: boolean;
  enabled: boolean;
  premium: boolean;
}

async function loadState(): Promise<ReminderState> {
  const [enabled, permission, premium] = await Promise.all([
    getRemindersEnabled(),
    getReminderPermission(),
    isPremium(),
  ]);
  return { denied: permission === "denied", enabled, premium };
}

function ReleaseRemindersSetting() {
  const { colors } = useBrand();
  const [state, setState] = useState<ReminderState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-read on focus: permission can be changed in system Settings while the
  // app is backgrounded.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadState()
        .then((next) => active && setState(next))
        .catch(
          () =>
            active &&
            setState({ denied: false, enabled: false, premium: false }),
        );
      return () => {
        active = false;
      };
    }, []),
  );

  async function toggle(next: boolean) {
    if (!state) return;
    setSaving(true);
    setError(null);

    try {
      if (next && !(await requestReminderPermission())) {
        setState({ ...state, denied: true });
        return;
      }

      await setRemindersEnabled(next);
      setState({
        ...state,
        denied: next ? false : state.denied,
        enabled: next,
      });
      await syncReminders();
    } catch {
      setError("Could not update reminders. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (state === null) {
    return <ActivityIndicator className="mt-4" color={colors.primary} />;
  }

  return (
    <View className="mt-3">
      <View className="flex-row items-center gap-3 rounded-md border border-line px-4 py-3">
        <View className="flex-1">
          <Text className="text-base text-fg">New release alerts</Text>
          <Text className="mt-0.5 text-sm text-muted">
            {state.premium
              ? "A notification at 9am when a movie comes out or a new episode airs."
              : "A Premium feature."}
          </Text>
        </View>
        {saving ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Switch
            accessibilityLabel="New release alerts"
            disabled={!state.premium}
            onValueChange={toggle}
            value={state.premium && state.enabled && !state.denied}
          />
        )}
      </View>

      {state.premium && state.denied ? <PermissionHint /> : null}

      {error && <Text className="mt-3 text-sm text-primary">{error}</Text>}
    </View>
  );
}
ReleaseRemindersSetting.displayName = "ReleaseRemindersSetting";

function PermissionHint() {
  return (
    <View className="mt-2 flex-row items-center justify-between gap-3">
      <Text className="flex-1 text-sm text-muted">
        Notifications are off for this app.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openSettings()}
      >
        <Text className="text-sm font-semibold text-fg">Open Settings</Text>
      </Pressable>
    </View>
  );
}
PermissionHint.displayName = "PermissionHint";

export { ReleaseRemindersSetting };
