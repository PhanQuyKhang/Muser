import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import type { PublicProfile } from "@/domain/social";
import { colors, radii, spacing } from "@/shared/theme";
import { Avatar, Text } from "@/shared/ui";

/** Avatar, display name and username, with optional actions underneath. */
export function PersonRow({ profile, children }: { profile: PublicProfile; children?: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.person}>
        <Avatar name={profile.displayName} />
        <View style={styles.text}>
          <Text variant="label" numberOfLines={1}>
            {profile.displayName}
          </Text>
          <Text variant="micro" color="textSecondary" numberOfLines={1}>
            @{profile.username}
          </Text>
        </View>
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radii.row,
    backgroundColor: colors.surface,
  },
  person: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  text: { flex: 1 },
  actions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
});
