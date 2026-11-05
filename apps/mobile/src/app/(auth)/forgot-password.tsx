import { useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";
import { useBrand } from "@/lib/theme";

/**
 * Sends the reset email. The link opens the web app's reset page in the
 * browser — one page for both apps, and it works from any mail app — then the
 * member comes back here and signs in with the new password.
 */
export default function ForgotPasswordScreen() {
  const { colors } = useBrand();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send the email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        <Text className="mb-2 font-display text-4xl text-fg">
          Forgot password
        </Text>
        <Text className="mb-8 text-base text-muted">
          Enter your email and we&apos;ll send you a link to choose a new
          password.
        </Text>

        {sent ? (
          <Text
            accessibilityLiveRegion="polite"
            className="mb-2 text-base text-accent"
          >
            If there&apos;s an account for that email, a reset link is on its
            way. Open it on any device to choose a new password, then sign in
            here with it. The link works once and expires after an hour.
          </Text>
        ) : (
          <>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              className="mb-2 rounded-md bg-surface px-4 py-3 text-fg"
              keyboardType="email-address"
              onChangeText={setEmail}
              onSubmitEditing={onSubmit}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              returnKeyType="send"
              value={email}
            />

            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mb-2 text-sm text-primary"
              >
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              className="mt-4 items-center rounded-md bg-primary py-3 active:opacity-80"
              disabled={submitting}
              onPress={onSubmit}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text className="text-base font-semibold text-on-primary">
                  Send reset link
                </Text>
              )}
            </Pressable>
          </>
        )}

        <View className="mt-6 flex-row justify-center">
          <Text className="text-muted">Remembered it? </Text>
          {/* Link drops NativeWind classes; style the Text it wraps. */}
          <Link asChild href="/login">
            <Text className="font-semibold text-fg">Sign in</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
