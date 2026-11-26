import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useServices } from "@/application/services";
import type { Sharer } from "@/domain/social";
import { socialKeys, useDiscoveries, useFriends } from "@/features/social/hooks";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { EmptyState, ErrorState, Icon, ListSkeleton, Text, initialsOf } from "@/shared/ui";
import { Deck } from "../components/Deck";
import { useReleasePlayerWhen } from "../hooks";

const t = strings.explore;

/** S11: songs shared by accepted friends. */
export function MyFriends() {
  const friends = useFriends();
  const discoveries = useDiscoveries();
  const failed = friends.isError || discoveries.isError;
  useReleasePlayerWhen(
    failed || !friends.data?.length || !discoveries.data || discoveries.data.length === 0,
  );

  if (failed) {
    return (
      <ErrorState
        onRetry={() => {
          void friends.refetch();
          void discoveries.refetch();
        }}
      />
    );
  }
  if (!friends.data || !discoveries.data) return <ListSkeleton />;
  if (friends.data.length === 0) {
    return (
      <EmptyState
        title={t.noFriends}
        message={t.noFriendsHint}
        actionLabel={strings.friends.add}
        onAction={() => router.push("/friends/find")}
      />
    );
  }
  if (discoveries.data.length === 0) {
    return (
      <EmptyState
        title={t.noShares}
        message={t.noSharesHint}
        actionLabel={t.refresh}
        onAction={() => void discoveries.refetch()}
      />
    );
  }

  return (
    <Deck
      deckId="friends"
      cards={discoveries.data.map(({ song, sharers }) => ({
        song,
        ...(sharers[0] ? { shareId: sharers[0].shareId } : {}),
        // The key resets the heart's request id for each song.
        attribution: <Attribution key={song.id} sharers={sharers} />,
      }))}
      source="friends"
      context={t.friendsContext}
      onRestart={() => void discoveries.refetch()}
    />
  );
}

/** Who shared the song, and the heart reaction. A heart never adds the song to Liked. */
function Attribution({ sharers }: { sharers: Sharer[] }) {
  const { social } = useServices();
  const queryClient = useQueryClient();
  const first = sharers[0];
  // One id per card, so pressing again after a lost response cannot send a second heart.
  const [requestId] = useState(
    () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  );
  const heart = useMutation({
    mutationFn: (shareId: string) => social.sendHeart(shareId, requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: socialKeys.discoveries }),
  });

  if (!first) return null;
  const sent = first.heartSent || heart.isSuccess;

  return (
    <View style={styles.column}>
      <View style={styles.pill}>
        <View style={styles.avatar}>
          <Text variant="captionMedium" color="onAccent">
            {initialsOf(first.displayName)}
          </Text>
        </View>
        <Text variant="optionHint" numberOfLines={1} style={styles.name}>
          {t.lovedBy(first.displayName, sharers.length - 1)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sent ? t.heartSent : t.sendHeartTo(first.displayName)}
          accessibilityState={{ disabled: sent, busy: heart.isPending }}
          disabled={sent || heart.isPending}
          onPress={() => heart.mutate(first.shareId)}
          style={styles.heart}
        >
          <Icon
            name={sent ? "heartFilled" : "heart"}
            size={sizes.iconSmall}
            color={sent ? "secondary" : "textPrimary"}
          />
        </Pressable>
      </View>
      {heart.isError ? (
        <View style={styles.error}>
          <Text variant="micro" color="error" accessibilityLiveRegion="polite">
            {strings.common.actionFailed}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.xs, maxWidth: "100%" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: sizes.touchTarget,
    paddingLeft: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    maxWidth: "100%",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  name: { flexShrink: 1 },
  heart: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
});
