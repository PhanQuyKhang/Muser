import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import { colors, radii, sizes, spacing, type ColorToken } from "@/shared/theme";
import { Text } from "../Text";

export type ButtonVariant = "primary" | "secondary" | "like" | "tertiary" | "destructive";
export type ButtonSize = "md" | "sm";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks presses. The width stays stable. */
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  /** Stretch to the container's width (default). */
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

interface VariantStyle {
  background: ColorToken | "transparent";
  text: ColorToken;
}

const variants: Record<ButtonVariant, VariantStyle> = {
  primary: { background: "primary", text: "onAccent" },
  secondary: { background: "surfaceElevated", text: "textPrimary" },
  like: { background: "secondary", text: "onAccent" },
  tertiary: { background: "transparent", text: "primary" },
  destructive: { background: "transparent", text: "error" },
};

const heights: Record<ButtonSize, number> = {
  md: sizes.buttonHeight,
  sm: sizes.touchTarget,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  fullWidth = true,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const { background, text } = variants[variant];

  const container: ViewStyle = {
    height: heights[size],
    minHeight: sizes.touchTarget,
    backgroundColor: background === "transparent" ? "transparent" : colors[background],
    alignSelf: fullWidth ? "stretch" : "flex-start",
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        container,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.content, loading && styles.hidden]}>
        {leftIcon}
        <Text variant="label" color={disabled ? "disabled" : text}>
          {label}
        </Text>
      </View>
      {loading ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.spinner}>
            <ActivityIndicator color={colors[text]} />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.control,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hidden: { opacity: 0 },
  spinner: { flex: 1, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
