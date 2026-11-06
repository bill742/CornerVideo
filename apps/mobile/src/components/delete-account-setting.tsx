import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { BRAND } from "@moviewatchlist/shared";

import { useAuth } from "@/lib/auth-context";
import type { Membership } from "@/lib/premium";
import { useBrand } from "@/lib/theme";

interface DeleteAccountSettingProps {
  membership: Membership | null;
}

/**
 * The Delete account section of the Membership tab. App Review guideline
 * 5.1.1(v) requires deletion inside the app, not just by email.
 *
 * A store subscription is billed by Apple or Google and can't be cancelled
 * from here, so the section says so before the member confirms. Plain copy:
 * the brand guide keeps settings text joke-free.
 */
function DeleteAccountSetting({ membership }: DeleteAccountSettingProps) {
  const { colors } = useBrand();
  const { deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store =
    membership?.premiumVia === "apple"
      ? "the App Store"
      : membership?.premiumVia === "google"
        ? "Google Play"
        : null;

  async function runDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      // The session is gone, so the root layout is already heading back to
      // the sign-in screens; this confirms what happened.
      Alert.alert(
        "Your account has been deleted.",
        "Everything on your shelf has been removed.",
      );
    } catch (err) {
      console.warn("delete-account failed:", err);
      setError(
        `We couldn't delete your account. Try again, or email ${BRAND.contactEmail} and we'll do it for you.`,
      );
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account, your shelf, your watched episodes and your settings. It can't be undone.",
      [
        { style: "cancel", text: "Cancel" },
        { onPress: runDelete, style: "destructive", text: "Delete account" },
      ],
    );
  }

  return (
    <View>
      <Text className="mt-8 text-xs uppercase tracking-wide text-muted">
        Delete account
      </Text>
      <Text className="mt-1 text-sm text-muted">
        Permanently deletes your account and everything on your shelf. A web
        Premium subscription is cancelled straight away.
      </Text>
      {store ? (
        <Text className="mt-2 text-sm font-semibold text-fg">
          Your Premium subscription through {store} isn&apos;t cancelled by
          deleting your account. Cancel it in your subscription settings first,
          or it will keep renewing.
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: deleting, disabled: deleting }}
        className="mt-3 items-center rounded-md border border-primary px-4 py-3 active:opacity-80"
        disabled={deleting}
        onPress={confirmDelete}
      >
        {deleting ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text className="text-base font-semibold text-primary">
            Delete account
          </Text>
        )}
      </Pressable>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-3 text-sm text-primary"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
DeleteAccountSetting.displayName = "DeleteAccountSetting";

export { DeleteAccountSetting };
