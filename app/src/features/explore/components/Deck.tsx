import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import type { Song } from "@/domain/catalog";
import { AddToPlaylistSheet } from "@/features/library/components/AddToPlaylistSheet";
import { useLikeToggle } from "@/features/library/hooks";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Button, CoverArt, EmptyState, Text } from "@/shared/ui";
import { SwipeCard } from "./SwipeCard";

const t = strings.explore;

export interface DeckCard {
  song: Song;
  /** The friend's share this like comes from (My Friends only). */
  shareId?: string;
  /** Extra content above the buttons, such as the sharer and the heart reaction. */
  extra?: ReactNode;
}

interface DeckProps {
  cards: DeckCard[];
  source: "my_explore" | "friends";
  onRestart: () => void;
}

/** One card at a time: swipe or press Like and Skip. Shared by My Explore and My Friends. */
export function Deck({ cards, source, onRestart }: DeckProps) {
  const { width, height } = useWindowDimensions();
  const likes = useLikeToggle();
  // Skipped and liked songs, so a refreshed list never shows them again in this pass.
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  const [addingTo, setAddingTo] = useState<Song | null>(null);
  const card = cards.find((item) => !done.has(item.song.id));

  if (!card) {
    return (
      <EmptyState
        title={t.finished}
        message={t.finishedHint}
        actionLabel={t.startOver}
        onAction={() => {
          setDone(new Set());
          onRestart();
        }}
      />
    );
  }

  const { song } = card;
  const liked = likes.likedIds.has(song.id);
  const advance = () => setDone((current) => new Set(current).add(song.id));
  const like = () => {
    // Liking an already liked song keeps the existing like (never re-shared).
    if (!liked) {
      likes.toggle({
        songId: song.id,
        liked: false,
        source,
        ...(card.shareId ? { sourceShareId: card.shareId } : {}),
      });
    }
    advance();
  };
  const coverSize = Math.min(width - sizes.pagePadding * 4, Math.round(height * 0.3));
  const artists = song.artistNames.join(", ");

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {likes.failed ? (
        <View style={styles.failed}>
          <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
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
      ) : null}
      <SwipeCard key={song.id} onSwipeLeft={advance} onSwipeRight={like}>
        <View style={styles.card}>
          <CoverArt seed={song.albumId ?? song.id} label={song.title} size={coverSize} />
          <Text variant="titleLarge" numberOfLines={2} style={styles.centered}>
            {song.title}
          </Text>
          <Text variant="body" color="textSecondary" numberOfLines={1}>
            {artists}
          </Text>
          {liked ? (
            <Text variant="microMedium" color="secondary">
              {t.alreadyLiked}
            </Text>
          ) : null}
        </View>
      </SwipeCard>
      {card.extra}
      <View style={styles.buttons}>
        <View style={styles.button}>
          <Button label={strings.common.skip} variant="secondary" onPress={advance} />
        </View>
        <View style={styles.button}>
          <Button label={t.like} variant="like" onPress={like} />
        </View>
      </View>
      <Button
        label={strings.library.addToPlaylist}
        variant="tertiary"
        onPress={() => setAddingTo(song)}
      />
      <Text variant="micro" color="textSecondary" style={styles.centered}>
        {t.swipeHint}
      </Text>
      {addingTo ? (
        <AddToPlaylistSheet
          songId={addingTo.id}
          songTitle={addingTo.title}
          onClose={() => setAddingTo(null)}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  centered: { textAlign: "center" },
  buttons: { flexDirection: "row", gap: spacing.md },
  button: { flex: 1 },
  failed: { alignItems: "center" },
});
