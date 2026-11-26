import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { useActivity } from "@/features/social/hooks";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import {
  DetailHeader,
  EmptyState,
  ErrorState,
  ListSkeleton,
  PersonAvatar,
  Text,
} from "@/shared/ui";
import { relativeTime } from "../relative-time";

const t = strings.activity;

/** S24: hearts received from friends. A withdrawn share shows no song details. */
export function ActivityScreen() {
  const activity = useActivity();

  return (
    <View style={styles.root}>
      <DetailHeader title={t.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {activity.isError ? (
          <ErrorState onRetry={() => void activity.refetch()} />
        ) : !activity.data ? (
          <ListSkeleton rows={3} />
        ) : activity.data.length === 0 ? (
          <EmptyState title={t.empty} />
        ) : (
          activity.data.map((item) => {
            const name = item.actor?.displayName ?? t.someone;
            return (
              <View key={item.id} style={styles.row} accessible>
                <PersonAvatar name={name} seed={item.actor?.uid ?? name} />
                <View style={styles.text}>
                  <Text variant="bodySmallStrong">{t.sentHeart(name)}</Text>
                  <Text variant="micro" color="textSecondary">
                    {item.song ? item.song.title : t.unavailable}
                  </Text>
                  <Text variant="micro" color="textSecondary">
                    {relativeTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.row,
    backgroundColor: colors.surface,
  },
  text: { flex: 1, gap: 1 },
});
