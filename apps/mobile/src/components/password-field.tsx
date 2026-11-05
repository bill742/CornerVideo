import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useBrand } from "@/lib/theme";

interface PasswordFieldProps {
  /** "password" to sign in, "new-password" to create one. */
  autoComplete: "new-password" | "password";
  onChangeText: (value: string) => void;
  value: string;
}

/**
 * A password field with a Show / Hide button, so members can check what they
 * typed instead of entering it twice. The button's accessible name starts
 * with its visible text ("Show password"), so voice control works with what's
 * on screen.
 */
function PasswordField({
  autoComplete,
  onChangeText,
  value,
}: PasswordFieldProps) {
  const { colors } = useBrand();
  const [shown, setShown] = useState(false);

  return (
    <View className="mb-2 flex-row items-center rounded-md bg-surface">
      <TextInput
        autoCapitalize="none"
        autoComplete={autoComplete}
        autoCorrect={false}
        className="flex-1 px-4 py-3 text-fg"
        onChangeText={onChangeText}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry={!shown}
        textContentType={
          autoComplete === "new-password" ? "newPassword" : "password"
        }
        value={value}
      />
      <Pressable
        accessibilityLabel={shown ? "Hide password" : "Show password"}
        accessibilityRole="button"
        className="px-4 py-3 active:opacity-70"
        hitSlop={4}
        onPress={() => setShown((current) => !current)}
      >
        <Text className="text-sm font-semibold text-muted">
          {shown ? "Hide" : "Show"}
        </Text>
      </Pressable>
    </View>
  );
}
PasswordField.displayName = "PasswordField";

export { PasswordField };
