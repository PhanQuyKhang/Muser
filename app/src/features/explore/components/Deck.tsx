import { router, useIsFocused } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { currentSong, usePlayerStore } from "@/application/player";
import type { Song } from "@/domain/catalog";
import { AddToPlaylistSheet } from "@/features/library/components/AddToPlaylistSheet";
import { useLikeToggle } from "@/features/library/hooks";
import { PlaybackControls } from "@/features/player/components/PlaybackControls";
import { useSharing } from "@/features/social/hooks";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing, type ColorToken } from "@/shared/theme";
import { Button, EmptyState, Icon, Text } from "@/shared/ui";
import type { IconName } from "@/shared/ui/Icon";
import { useGenreLabels } from "../hooks";
import { DiscoveryCard } from "./DiscoveryCard";
import { SwipeCard } from "./SwipeCard";

const t = strings.explore;
const SAVED_MS = 2000;
const NONE: readonly string[] = [];

export interface DeckCard {
  song: Song;
  /** The friend's share this like comes from (My Friends only). */
  shareId?: string;
  /** Pill over the artwork, such as the sharer and the heart reaction. */
  attribution?: ReactNode;
}

interface DeckProps {
  /** Names the playback queue, so each feed keeps its own place. */
  deckId: string;
  cards: DeckCard[];
  source: "my_explore" | "friends";
  context: string;
  onRestart: () => void;
}

function ActionButton({
  label,
  icon,
  iconSize,
  background,
  color,
  onPress,
}: {
  label: string;
  icon: IconName;
  iconSize: number;
  background: ColorToken;
  color: ColorToken;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: colors[background] },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={iconSize} color={color} />
      <Text variant="label" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

/** One card at a time: swipe or press Like and Skip. Shared by My Explore and My Friends. */
export function Deck({ deckId, cards, source, context, onRestart }: DeckProps) {
  const likes = useLikeToggle();
  const sharing = useSharing().query.data;
  const genres = useGenreLabels();
  const [addingTo, setAddingTo] = useState<Song | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const passed = usePlayerStore((state) => state.passed[deckId] ?? NONE);
  const loadedId = usePlayerStore((state) => (state.queue?.id === deckId ? state.currentId : null));
  const { activate, advance, restart } = usePlayerStore.getState();

  const songs = cards.map((item) => item.song);
  const focused = useIsFocused();
  // Runs after every render; the store ignores a queue that has not changed. A deck behind
  // another tab only refreshes its own queue, so it never interrupts a playlist.
  useEffect(() => {
    if (focused || usePlayerStore.getState().queue?.id === deckId) {
      activate({ id: deckId, songs });
    }
  });

  useEffect(() => {
    if (saved === null) return;
    const timer = setTimeout(() => setSaved(null), SAVED_MS);
    return () => clearTimeout(timer);
  }, [saved]);

  const song = currentSong(songs, passed, loadedId);
  const card = cards.find((item) => item.song.id === song?.id);

  if (!card) {
    return (
      <EmptyState
        title={t.finished}
        message={t.finishedHint}
        actionLabel={t.startOver}
        onAction={() => {
          restart(deckId);
          onRestart();
        }}
      />
    );
  }

  const next = songs.find((item) => item.id !== card.song.id && !passed.includes(item.id));
  const liked = likes.likedIds.has(card.song.id);
  const like = () => {
    // Liking an already liked song keeps the existing like (never re-shared).
    if (!liked) {
      const message = sharing === undefined ? t.saved : sharing ? t.savedShared : t.savedPrivate;
      likes.toggle(
        {
          songId: card.song.id,
          liked: false,
          source,
          ...(card.shareId ? { sourceShareId: card.shareId } : {}),
        },
        // Confirmed only once the server has saved it.
        { onSuccess: () => setSaved(message) },
      );
    }
    advance();
  };
  const sharingLine =
    sharing === undefined
      ? undefined
      : {
          label: sharing ? t.sharingOn : t.sharingOff,
          onPress: () => router.push("/account/privacy"),
        };

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        {next ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={styles.nextCard}
          >
            <DiscoveryCard song={next} genre={genres(next)} context={context} />
          </View>
        ) : null}
        <SwipeCard key={card.song.id} onSwipeLeft={advance} onSwipeRight={like}>
          <DiscoveryCard
            song={card.song}
            genre={genres(card.song)}
            context={liked ? t.alreadyLiked : context}
            sharing={sharingLine}
            attribution={card.attribution}
            onMore={() => setAddingTo(card.song)}
          />
        </SwipeCard>
        {likes.failed ? (
          <View style={[styles.toast, styles.toastError]}>
            <Text variant="microMedium" color="error" accessibilityLiveRegion="polite">
              {t.likeFailed}
            </Text>
            <Button
              label={strings.common.retry}
              variant="tertiary"
              size="sm"
              fullWidth={false}
              onPress={likes.retry}
            />
          </View>
        ) : saved ? (
          <View style={styles.toast} pointerEvents="none">
            <Text variant="microMedium" color="onAccent" accessibilityLiveRegion="polite">
              {saved}
            </Text>
          </View>
        ) : null}
      </View>
      <PlaybackControls />
      <View style={styles.actions}>
        <ActionButton
          label={strings.common.skip}
          icon="skip"
          iconSize={sizes.iconSmall}
          background="surfaceElevated"
          color="textSecondary"
          onPress={advance}
        />
        <ActionButton
          label={t.like}
          icon="likeOutline"
          iconSize={sizes.iconSmall}
          background="secondary"
          color="onAccent"
          onPress={like}
        />
      </View>
      {addingTo ? (
        <AddToPlaylistSheet
          songId={addingTo.id}
          songTitle={addingTo.title}
          onClose={() => setAddingTo(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingBottom: spacing.sm, gap: spacing.md },
  stage: { flex: 1, marginHorizontal: sizes.cardInset, marginTop: spacing.sm },
  nextCard: {
    position: "absolute",
    top: spacing.sm,
    bottom: 0,
    left: spacing.sm,
    right: spacing.sm,
    opacity: 0.65,
  },
  toast: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
    minHeight: sizes.savedToast,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
  },
  toastError: { backgroundColor: colors.surfaceElevated },
  actions: { flexDirection: "row", gap: spacing.md, paddingHorizontal: sizes.cardInset },
  action: {
    flex: 1,
    height: sizes.actionButtonHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.pill,
  },
  pressed: { opacity: 0.85 },
});
