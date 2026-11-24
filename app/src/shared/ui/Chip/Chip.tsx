import { Pressable, StyleSheet } from "react-native";

import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Text } from "../Text";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

/** Selectable pill (genre and mood choices, filters). Selection is not color-only: it also flips the label color. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.idle]}
    >
      <Text variant="label" color={selected ? "onAccent" : "textPrimary"}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.touchTarget - 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: sizes.borderWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
