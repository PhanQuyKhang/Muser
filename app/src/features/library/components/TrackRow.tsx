import { Pressable, StyleSheet, View } from "react-native";

import { useCurrentSong } from "@/application/player";
import type { Song } from "@/domain/catalog";
import { strings } from "@/shared/strings";
import { radii, sizes, spacing } from "@/shared/theme";
import { CoverArt, Text } from "@/shared/ui";

const t = strings.library;

export interface TrackRowProps {
  /** null when the catalog withdrew the song: the saved entry stays and can still be removed. */
  song: Song | null;
  songId: string;
  onPlay: () => void;
  onMore: () => void;
}

/** A song in a list: tap to play, dots for everything else. */
export function TrackRow({ song, songId, onPlay, onMore }: TrackRowProps) {
  const playing = useCurrentSong()?.id === songId;
  const title = song?.title ?? t.unavailableSong;
  const artists = song?.artistNames.join(", ") ?? "";

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.playSong(title)}
        accessibilityState={{ selected: playing, disabled: !song }}
        disabled={!song}
        onPress={onPlay}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <CoverArt seed={song?.albumId ?? songId} label={title} size={sizes.trackCover} />
        <View style={styles.text}>
          <Text
            variant="bodySmallStrong"
            color={playing ? "primary" : "textPrimary"}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text variant="micro" color={playing ? "primary" : "textSecondary"} numberOfLines={1}>
            {playing ? `${t.nowPlaying} · ${artists}` : artists}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.moreLabel(title)}
        onPress={onMore}
        style={styles.more}
      >
        <Text variant="subheading" color="textSecondary">
          •••
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: sizes.trackRow, flexDirection: "row", alignItems: "center" },
  main: {
    flex: 1,
    minHeight: sizes.trackRow,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.badge,
  },
  pressed: { opacity: 0.85 },
  text: { flex: 1, gap: 2 },
  more: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
