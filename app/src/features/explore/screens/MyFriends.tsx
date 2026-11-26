import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useServices } from "@/application/services";
import type { Sharer } from "@/domain/social";
import { socialKeys, useDiscoveries, useFriends } from "@/features/social/hooks";
import { strings } from "@/shared/strings";
import { colors, radii, spacing } from "@/shared/theme";
import { Avatar, Button, EmptyState, ErrorState, ListSkeleton, Text } from "@/shared/ui";
import { Deck } from "../components/Deck";

const t = strings.explore;

/** S11: songs shared by accepted friends. */
export function MyFriends() {
  const friends = useFriends();
  const discoveries = useDiscoveries();

  if (friends.isError || discoveries.isError) {
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
      cards={discoveries.data.map(({ song, sharers }) => ({
        song,
        ...(sharers[0] ? { shareId: sharers[0].shareId } : {}),
        // Differs from the card's key (the two are siblings) and resets the heart per song.
        extra: <Attribution key={`sharers-${song.id}`} sharers={sharers} />,
      }))}
      source="friends"
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
  const others = sharers.length - 1;
  const sent = first.heartSent || heart.isSuccess;

  return (
    <View style={styles.attribution}>
      <View style={styles.who}>
        <Avatar name={first.displayName} size={32} />
        <Text variant="bodySmallStrong" style={styles.name}>
          {t.lovedBy(first.displayName, others)}
        </Text>
      </View>
      <Button
        label={sent ? t.heartSent : t.sendHeart}
        accessibilityLabel={sent ? t.heartSent : t.sendHeartTo(first.displayName)}
        variant="secondary"
        size="sm"
        disabled={sent}
        loading={heart.isPending}
        onPress={() => heart.mutate(first.shareId)}
      />
      {heart.isError ? (
        <Text variant="micro" color="error" accessibilityLiveRegion="polite">
          {strings.common.actionFailed}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  attribution: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.row,
    backgroundColor: colors.surface,
  },
  who: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { flex: 1 },
});
