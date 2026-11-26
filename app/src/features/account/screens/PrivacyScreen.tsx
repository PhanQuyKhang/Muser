import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useSharing } from "@/features/social/hooks";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { ErrorState, Header, ListSkeleton, Switch, Text } from "@/shared/ui";

const t = strings.privacy;

/** S23: the sharing switch and what turning it off and on again means. */
export function PrivacyScreen() {
  const { query, update } = useSharing();
  const enabled = update.isPending ? update.variables : query.data;

  return (
    <View style={styles.root}>
      <Header title={t.title} onBack={() => router.back()} />
      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : enabled === undefined ? (
        <ListSkeleton rows={1} />
      ) : (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text variant="label" style={styles.label}>
              {t.share}
            </Text>
            <Switch
              label={t.share}
              value={enabled}
              disabled={update.isPending}
              onValueChange={(value) => update.mutate(value)}
            />
          </View>
          <Text variant="body" color={enabled ? "secondary" : "textSecondary"}>
            {enabled ? t.on : t.off}
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            {t.explanation}
          </Text>
          {update.isError ? (
            <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
              {strings.common.actionFailed}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, gap: spacing.md },
  card: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.row,
    backgroundColor: colors.surface,
  },
  label: { flex: 1 },
});
