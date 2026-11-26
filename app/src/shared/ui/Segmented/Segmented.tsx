import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Text } from "../Text";

interface SegmentedProps<T extends string> {
  options: { id: T; label: string; count?: number }[];
  selected: T;
  onSelect: (id: T) => void;
}

/** Tabs inside one rounded container (Explore feeds, friend requests). */
export function Segmented<T extends string>({ options, selected, onSelect }: SegmentedProps<T>) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {options.map(({ id, label, count }) => {
        const active = id === selected;
        return (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            hitSlop={{ top: spacing.xs, bottom: spacing.xs }}
            onPress={() => onSelect(id)}
            style={[styles.tab, active && styles.selected]}
          >
            <Text variant="label" color={active ? "textPrimary" : "textSecondary"}>
              {label}
            </Text>
            {count === undefined ? null : (
              <Text variant="label" color="secondary">
                {count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: spacing.xs,
    height: sizes.exploreTabs,
    padding: spacing.xs,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.segment,
  },
  selected: { backgroundColor: colors.surfaceElevated },
});
