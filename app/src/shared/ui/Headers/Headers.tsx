import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/strings";
import { sizes, spacing } from "@/shared/theme";
import { Icon } from "../Icon";
import { Text } from "../Text";

interface TabHeaderProps {
  title: string;
  subtitle?: string;
  /** Button or label on the right. */
  right?: ReactNode;
}

/** The large title of a tab's root screen (Figma "Header"). */
export function TabHeader({ title, subtitle, right }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tab, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <Text variant="titleLarge" accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? (
        <Text variant="body" color="textSecondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

interface DetailHeaderProps {
  title: string;
  /** A small capital label (playlists, artists) instead of a screen title. */
  eyebrow?: boolean;
  onBack: () => void;
  right?: ReactNode;
}

/** Back button, centered title and an optional action (Figma "Detail header"). */
export function DetailHeader({ title, eyebrow = false, onBack, right }: DetailHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.detail, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.common.back}
        onPress={onBack}
        style={styles.side}
      >
        <Icon name="chevronLeft" color="textPrimary" />
      </Pressable>
      <Text
        variant={eyebrow ? "eyebrow" : "sectionTitle"}
        color={eyebrow ? "textSecondary" : "textPrimary"}
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.lg, gap: spacing.sm },
  row: {
    minHeight: sizes.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  side: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center" },
});
