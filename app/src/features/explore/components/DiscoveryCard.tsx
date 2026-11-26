import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { Song } from "@/domain/catalog";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Text } from "@/shared/ui";
import { toneFor } from "@/shared/ui/CoverArt/CoverArt";

interface DiscoveryCardProps {
  song: Song;
  genre?: string | undefined;
  /** One line on why the song is here. */
  context: string;
  /** Sharing state, which opens the privacy setting. */
  sharing?: { label: string; onPress: () => void } | undefined;
  /** Pill over the artwork (My Friends: who shared it). */
  attribution?: ReactNode;
  onMore?: () => void;
}

/** The Figma discovery card: artwork with its badges, then the track details. */
export function DiscoveryCard({
  song,
  genre,
  context,
  sharing,
  attribution,
  onMore,
}: DiscoveryCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.art, { backgroundColor: toneFor(song.albumId ?? song.id) }]}>
        {/* Placeholder until the API serves cover images. */}
        <Text
          variant="artLetter"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {song.title.trim().charAt(0).toUpperCase()}
        </Text>
        {genre ? (
          <View style={styles.genre}>
            <Text variant="badge">{genre.toUpperCase()}</Text>
          </View>
        ) : null}
        {attribution ? <View style={styles.attribution}>{attribution}</View> : null}
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text variant="cardTitle" numberOfLines={1} style={styles.title}>
            {song.title}
          </Text>
          {onMore ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.library.addToPlaylist}
              onPress={onMore}
              style={styles.more}
            >
              <Text variant="cardMore" color="textSecondary">
                •••
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text variant="body" color="textSecondary" numberOfLines={1}>
          {song.artistNames.join(", ")}
        </Text>
        <Text variant="micro" color="textSecondary" numberOfLines={1}>
          {context}
        </Text>
        {sharing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={sharing.label}
            hitSlop={{ top: spacing.lg, bottom: spacing.lg }}
            onPress={sharing.onPress}
            style={styles.sharing}
          >
            <Text variant="captionMedium" color="secondary">
              •{"  "}
              {sharing.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  art: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.control,
    overflow: "hidden",
  },
  genre: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    height: sizes.genreBadge,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  attribution: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    alignItems: "flex-start",
  },
  info: { height: sizes.cardInfo, paddingTop: spacing.md, paddingLeft: spacing.xs, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { flex: 1 },
  more: {
    width: sizes.touchTarget,
    height: 32,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sharing: { alignSelf: "flex-start" },
});
