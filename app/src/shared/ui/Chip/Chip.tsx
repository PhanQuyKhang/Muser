import { Pressable, StyleSheet } from "react-native";

import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Text } from "../Text";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** pill: compact rounded chip (moods, filters). tile: bordered 50-high tile, sized by its parent (genres). */
  shape?: "pill" | "tile";
}

/** Selectable choice. Selection is not color-only: the label color flips too, and it is exposed as `selected`. */
export function Chip({ label, selected = false, onPress, shape = "pill" }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.base,
        shape === "tile" ? styles.tile : styles.pill,
        selected && styles.selected,
      ]}
    >
      <Text variant="label" color={selected ? "onAccent" : "textPrimary"} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  pill: { minHeight: 44, borderRadius: radii.card },
  tile: {
    height: 50,
    borderRadius: radii.control,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
