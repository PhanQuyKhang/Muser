import { Pressable, StyleSheet } from "react-native";

import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Text } from "../Text";

interface SheetOptionProps {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  selected?: boolean;
}

/** One action in a bottom sheet menu (Figma "Song actions"). */
export function SheetOption({
  label,
  onPress,
  destructive = false,
  disabled = false,
  selected,
}: SheetOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, ...(selected === undefined ? {} : { selected }) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="label" color={disabled ? "disabled" : destructive ? "error" : "textPrimary"}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: sizes.sheetOption,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radii.badge,
    backgroundColor: colors.surfaceElevated,
    borderWidth: sizes.borderWidth,
    borderColor: "transparent",
  },
  selected: { borderColor: colors.primary },
  pressed: { opacity: 0.85 },
});
