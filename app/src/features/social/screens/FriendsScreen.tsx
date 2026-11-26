import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ConfirmSheet } from "@/features/library/components/ConfirmSheet";
import type { FriendEntry } from "@/domain/social";
import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Button, EmptyState, ErrorState, Header, ListSkeleton } from "@/shared/ui";
import { PersonRow } from "../components/PersonRow";
import { useFriendActions, useFriendRequests, useFriends } from "../hooks";

const t = strings.friends;

/** S17: current friends, with entry points to Find friends (S18) and Requests (S19). */
export function FriendsScreen() {
  const friends = useFriends();
  const requests = useFriendRequests();
  const { remove } = useFriendActions();
  const [removing, setRemoving] = useState<FriendEntry | null>(null);
  const incoming = requests.data?.incoming.length ?? 0;

  return (
    <View style={styles.root}>
      <Header title={t.title} />
      <ScrollView contentContainerStyle={styles.content}>
        <Button label={t.add} onPress={() => router.push("/friends/find")} />
        <Button
          label={t.requests(incoming)}
          variant="secondary"
          onPress={() => router.push("/friends/requests")}
        />
        {friends.isError ? (
          <ErrorState onRetry={() => void friends.refetch()} />
        ) : !friends.data ? (
          <ListSkeleton rows={3} />
        ) : friends.data.length === 0 ? (
          <EmptyState title={t.empty} message={t.emptyHint} />
        ) : (
          friends.data.map((friend) => (
            <PersonRow key={friend.pairId} profile={friend.profile}>
              <Button
                label={t.remove}
                accessibilityLabel={t.removeLabel(friend.profile.displayName)}
                variant="destructive"
                size="sm"
                fullWidth={false}
                onPress={() => {
                  remove.reset();
                  setRemoving(friend);
                }}
              />
            </PersonRow>
          ))
        )}
      </ScrollView>
      {removing ? (
        <ConfirmSheet
          title={t.removeTitle(removing.profile.displayName)}
          message={t.removeMessage}
          confirmLabel={t.remove}
          busy={remove.isPending}
          failed={remove.isError}
          onClose={() => setRemoving(null)}
          onConfirm={() => remove.mutate(removing.pairId, { onSuccess: () => setRemoving(null) })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.sm },
});
