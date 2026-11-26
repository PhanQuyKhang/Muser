import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { useSharing } from "@/features/social/hooks";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { DetailHeader, ErrorState, ListSkeleton, Switch, Text } from "@/shared/ui";

const t = strings.privacy;

/** S23: the sharing switch and what turning it off and on again means. */
export function PrivacyScreen() {
  const { query, update } = useSharing();
  const enabled = update.isPending ? update.variables : query.data;

  return (
    <View style={styles.root}>
      <DetailHeader title={t.title} onBack={() => router.back()} />
      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : enabled === undefined ? (
        <ListSkeleton rows={1} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="headline">{t.headline}</Text>
          <Text variant="body" color="textSecondary">
            {t.intro}
          </Text>
          <View style={styles.switchCard}>
            <View style={styles.switchText}>
              <Text variant="optionTitle">{t.share}</Text>
              <Text variant="micro" color="textSecondary">
                {t.shareHint}
              </Text>
            </View>
            <Switch
              label={t.share}
              value={enabled}
              disabled={update.isPending}
              onValueChange={(value) => update.mutate(value)}
            />
          </View>
          <View style={styles.rules}>
            <Text variant="optionTitle" color="secondary">
              {t.ruleTitle}
            </Text>
            <Text variant="optionHint" color="textSecondary">
              {t.rule}
            </Text>
            <Text variant="optionHint" color="textSecondary">
              {t.explanation}
            </Text>
          </View>
          <Text variant="micro" color="textSecondary">
            {t.footnote}
          </Text>
          {update.isError ? (
            <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
              {strings.common.actionFailed}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.lg },
  switchCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg + 2,
    marginTop: spacing.lg,
    borderRadius: radii.row + 2,
    backgroundColor: colors.surface,
  },
  switchText: { flex: 1, gap: spacing.xs },
  rules: {
    gap: spacing.md,
    padding: spacing.lg + 2,
    borderRadius: radii.row + 2,
    backgroundColor: colors.surface,
  },
});
