import { Pressable, StyleSheet, View } from "react-native";

import { spacing } from "@/shared/theme";
import { Text } from "@/shared/ui";

interface AuthFooterProps {
  copy: string;
  linkLabel: string;
  onPress: () => void;
}

/** "New here? Create account" style switch between Auth screens. */
export function AuthFooter({ copy, linkLabel, onPress }: AuthFooterProps) {
  return (
    <View style={styles.row}>
      <Text variant="bodySmall" color="textSecondary">
        {copy}
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={linkLabel}
        hitSlop={8}
        onPress={onPress}
        style={styles.link}
      >
        <Text variant="bodySmallStrong" color="primary">
          {linkLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.xs },
  link: { minHeight: 44, justifyContent: "center" },
});
