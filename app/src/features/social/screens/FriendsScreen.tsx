import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useExploreFeed } from "@/application/explore-feed";
import type { FriendEntry } from "@/domain/social";
import { ConfirmSheet } from "@/features/library/components/ConfirmSheet";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import {
  EmptyState,
  ErrorState,
  Icon,
  ListSkeleton,
  NavCard,
  PersonAvatar,
  Sheet,
  SheetOption,
  TabHeader,
  Text,
} from "@/shared/ui";
import { toneFor } from "@/shared/ui/CoverArt";
import { useFriendActions, useFriendRequests, useFriends } from "../hooks";

const t = strings.friends;

/** S17: current friends, with entry points to Find friends (S18) and Requests (S19). */
export function FriendsScreen() {
  const friends = useFriends();
  const requests = useFriendRequests();
  const { remove } = useFriendActions();
  const [selected, setSelected] = useState<FriendEntry | null>(null);
  const [confirming, setConfirming] = useState(false);
  const incoming = requests.data?.incoming.length ?? 0;
  const close = () => {
    setSelected(null);
    setConfirming(false);
  };

  return (
    <View style={styles.root}>
      <TabHeader
        title={t.title}
        subtitle={t.subtitle}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.findLabel}
            hitSlop={spacing.xs}
            onPress={() => router.push("/friends/find")}
            style={styles.add}
          >
            <Icon name="addFriend" color="primary" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t.promoTitle} ${t.promoBody}`}
          onPress={() => {
            useExploreFeed.getState().setFeed("friends");
            router.navigate("/explore");
          }}
          style={({ pressed }) => [styles.promo, pressed && styles.pressed]}
        >
          <View style={styles.promoText}>
            <Text variant="badge" color="secondary">
              {t.promoEyebrow}
            </Text>
            <Text variant="sectionTitle">{t.promoTitle}</Text>
            <Text variant="caption" color="textSecondary">
              {t.promoBody}
            </Text>
          </View>
          <View style={styles.art} />
        </Pressable>

        <NavCard
          title={t.requests}
          subtitle={t.waiting(incoming)}
          elevated
          leading={
            <View style={styles.count}>
              <Text variant="label" color="onAccent">
                {incoming}
              </Text>
            </View>
          }
          onPress={() => router.push("/friends/requests")}
        />

        <View style={styles.heading}>
          <Text variant="sectionTitle">{t.people}</Text>
          {friends.data ? (
            <Text variant="optionHint" color="textSecondary">
              {t.count(friends.data.length)}
            </Text>
          ) : null}
        </View>

        {friends.isError ? (
          <ErrorState onRetry={() => void friends.refetch()} />
        ) : !friends.data ? (
          <ListSkeleton rows={3} />
        ) : friends.data.length === 0 ? (
          <EmptyState title={t.empty} message={t.emptyHint} />
        ) : (
          friends.data.map((friend) => (
            <View key={friend.pairId} style={styles.row}>
              <PersonAvatar name={friend.profile.displayName} seed={friend.profile.uid} />
              <View style={styles.identity}>
                <Text variant="optionTitle" numberOfLines={1}>
                  {friend.profile.displayName}
                </Text>
                <Text variant="micro" color="textSecondary" numberOfLines={1}>
                  @{friend.profile.username}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.moreLabel(friend.profile.displayName)}
                onPress={() => {
                  remove.reset();
                  setSelected(friend);
                }}
                style={styles.more}
              >
                <Text variant="subheading" color="textSecondary">
                  •••
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {selected && !confirming ? (
        <Sheet
          title={selected.profile.displayName}
          message={`@${selected.profile.username}`}
          onClose={close}
        >
          <SheetOption label={t.remove} destructive onPress={() => setConfirming(true)} />
          <SheetOption label={strings.common.cancel} onPress={close} />
        </Sheet>
      ) : null}
      {selected && confirming ? (
        <ConfirmSheet
          title={t.removeTitle(selected.profile.displayName)}
          message={t.removeMessage}
          confirmLabel={t.remove}
          keepLabel={t.keep}
          busy={remove.isPending}
          failed={remove.isError}
          onClose={close}
          onConfirm={() => remove.mutate(selected.pairId, { onSuccess: close })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  add: {
    width: sizes.headerButton,
    height: sizes.headerButton,
    borderRadius: sizes.headerButton / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
  },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.md },
  promo: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card - 2,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  promoText: { flex: 1, gap: spacing.xs },
  art: {
    width: 62,
    height: 62,
    borderRadius: radii.segment,
    backgroundColor: toneFor("friends"),
    transform: [{ rotate: "8deg" }],
  },
  pressed: { opacity: 0.85 },
  count: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md },
  identity: { flex: 1, gap: 3 },
  more: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
