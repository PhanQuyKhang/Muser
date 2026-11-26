import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/strings";
import { sizes, spacing } from "@/shared/theme";
import { Icon } from "../Icon";
import { Text } from "../Text";

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

/** Title block of a tab screen, with the safe-area top inset and an optional back button. */
export function Header({ title, subtitle, onBack }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.common.back}
          onPress={onBack}
          style={styles.back}
        >
          <Icon name="chevronLeft" color="textPrimary" />
        </Pressable>
      ) : null}
      <Text variant="titleLarge" accessibilityRole="header" numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodySmall" color="textSecondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.md, gap: spacing.xs },
  back: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    justifyContent: "center",
    marginLeft: -spacing.xs,
  },
});
