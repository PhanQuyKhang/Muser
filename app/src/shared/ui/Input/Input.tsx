import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { colors, radii, sizes, spacing, typography, type ColorToken } from "@/shared/theme";
import { Icon } from "../Icon";
import { Text } from "../Text";

export interface InputProps extends Pick<
  TextInputProps,
  | "value"
  | "onChangeText"
  | "placeholder"
  | "autoCapitalize"
  | "autoComplete"
  | "autoCorrect"
  | "keyboardType"
  | "returnKeyType"
  | "onSubmitEditing"
  | "maxLength"
  | "autoFocus"
  | "editable"
> {
  /** Persistent label above the field. Placeholders are examples, never the only label. */
  label: string;
  error?: string | undefined;
  /** Hint under the field (for example password rules). Replaced by the error when there is one. */
  helper?: string | undefined;
  /** Color of the helper text; use secondary for positive confirmation. */
  helperColor?: ColorToken;
  /** Adds a show/hide control and hides the characters. */
  secure?: boolean;
  /** The label is only read aloud (the Figma sheets show a placeholder). */
  hideLabel?: boolean;
}

export function Input({
  label,
  error,
  helper,
  helperColor = "textSecondary",
  secure = false,
  hideLabel = false,
  editable = true,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={styles.group}>
      {hideLabel ? null : <Text variant="fieldLabel">{label}</Text>}
      <View style={[styles.field, { borderColor }, !editable && styles.readOnly]}>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          editable={editable}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            hitSlop={8}
            onPress={() => setRevealed((value) => !value)}
            style={styles.reveal}
          >
            <Icon name={revealed ? "eyeOff" : "eye"} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="micro" color="error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="micro" color={helperColor} accessibilityLiveRegion="polite">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm - 2 },
  field: {
    minHeight: sizes.inputHeight,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.control,
    borderWidth: sizes.borderWidth,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  readOnly: { opacity: 0.7 },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  reveal: { minHeight: sizes.touchTarget, justifyContent: "center", paddingLeft: spacing.md },
});
