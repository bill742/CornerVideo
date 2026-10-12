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

export default function SignupScreen() {
  const { colors } = useBrand();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      // If email confirmation is enabled there's no session yet; otherwise the
      // root navigator redirects on the new session.
      setMessage("Check your email to confirm your account, then sign in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign up");
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
          Create account
        </Text>
        <Text className="mb-8 text-base text-muted">
          Keep every movie and show you want to see on one shelf.
        </Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          className="mb-4 rounded-md bg-surface px-4 py-3 text-fg"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          className="mb-2 rounded-md bg-surface px-4 py-3 text-fg"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
        />

        {error ? (
          <Text className="mb-2 text-sm text-primary">{error}</Text>
        ) : null}
        {message ? (
          <Text className="mb-2 text-sm text-accent">{message}</Text>
        ) : null}

        <Pressable
          className="mt-4 items-center rounded-md bg-primary py-3 active:opacity-80"
          disabled={submitting}
          onPress={onSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text className="text-base font-semibold text-on-primary">
              Sign up
            </Text>
          )}
        </Pressable>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-muted">Have an account? </Text>
          <Link className="font-semibold text-fg" href="/login">
            Sign in
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
