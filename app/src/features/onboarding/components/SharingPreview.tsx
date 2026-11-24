import { StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors, radii, spacing } from "@/shared/theme";
import { Avatar, CoverArt, Icon, Text } from "@/shared/ui";

/** Illustrative card showing what a friend sees; sample content, not real data. */
export function SharingPreview() {
  return (
    <View
      accessible
      accessibilityLabel={strings.onboarding.sharing.previewMessage}
      style={styles.card}
    >
      <View style={styles.covers}>
        <View style={styles.coverBack}>
          <CoverArt seed="preview-one" label="M" size={124} />
        </View>
        <View style={styles.coverFront}>
          <CoverArt seed="preview-two" label="U" size={124} />
        </View>
      </View>
      <View style={styles.friend}>
        <Avatar name="Jamie L" size={28} />
        <Text variant="microMedium">{strings.onboarding.sharing.previewMessage}</Text>
      </View>
    </View>
  );
}

interface SharingRuleProps {
  icon: "check" | "circle";
  title: string;
  body: string;
}

export function SharingRule({ icon, title, body }: SharingRuleProps) {
  return (
    <View style={styles.rule}>
      <View style={styles.symbol}>
        <Icon name={icon} size={16} color="secondary" />
      </View>
      <View style={styles.ruleCopy}>
        <Text variant="label">{title}</Text>
        <Text variant="fieldLabel" color="textSecondary">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg + spacing.sm,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  covers: { width: 220, height: 128 },
  coverBack: { position: "absolute", left: 0, top: 0, opacity: 0.7 },
  coverFront: { position: "absolute", right: 0, top: 2 },
  friend: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm - 1,
    paddingLeft: spacing.sm - 1,
    paddingRight: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
  },
  rule: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  symbol: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleCopy: { flex: 1, gap: 2 },
});
