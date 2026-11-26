import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/shared/theme";
import { Text } from "../Text";

interface NavCardProps {
  title: string;
  subtitle: string;
  /** Icon or badge in front. */
  leading?: ReactNode;
  /** The lighter card used for friend requests. */
  elevated?: boolean;
  onPress: () => void;
}

/** A card that opens another screen: leading mark, two lines and a chevron. */
export function NavCard({ title, subtitle, leading, elevated = false, onPress }: NavCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, elevated && styles.elevated, pressed && styles.pressed]}
    >
      {leading}
      <View style={styles.text}>
        <Text variant="optionTitle" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="optionHint" color="textSecondary" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text variant="chevron" color="textSecondary">
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.row,
    backgroundColor: colors.surface,
  },
  elevated: { backgroundColor: colors.surfaceElevated },
  pressed: { opacity: 0.85 },
  text: { flex: 1, gap: spacing.xs },
});
