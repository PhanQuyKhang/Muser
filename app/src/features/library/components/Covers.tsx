import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import type { LibraryEntry } from "@/domain/library";
import { strings } from "@/shared/strings";
import { colors, radii } from "@/shared/theme";
import { Icon, Text } from "@/shared/ui";
import { toneFor } from "@/shared/ui/CoverArt";

/** The lavender-to-mint tile that stands for Liked. */
export function LikedCover({ size }: { size: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.liked, { width: size, height: size }]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="liked" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.secondary} />
            <Stop offset="0.72" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#liked)" />
      </Svg>
      <Icon name="likedCover" size={Math.round(size * 0.42)} color="onAccent" />
      <Text variant="badge" color="onAccent">
        {strings.library.likedBadge}
      </Text>
    </View>
  );
}

/** A 2×2 collage of a playlist's first songs, as colored tiles until covers exist. */
export function Collage({
  entries,
  seed,
  size,
}: {
  entries: LibraryEntry[];
  /** Used for the tiles of an empty playlist. */
  seed: string;
  size: number;
}) {
  const songs = entries.flatMap((entry) => (entry.song ? [entry.song] : []));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.collage, { width: size, height: size }]}
    >
      {[0, 1, 2, 3].map((index) => {
        const song = songs.length > 0 ? songs[index % songs.length] : undefined;
        // Letters keep the four tiles apart when two songs share a color.
        return (
          <View
            key={index}
            style={[
              styles.tile,
              {
                width: size / 2,
                height: size / 2,
                backgroundColor: toneFor(song ? (song.albumId ?? song.id) : `${seed}${index}`),
              },
            ]}
          >
            {song ? (
              <Text variant={size > 80 ? "sectionTitle" : "bodySmallStrong"}>
                {song.title.charAt(0).toUpperCase()}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  liked: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: radii.row,
    overflow: "hidden",
  },
  tile: { alignItems: "center", justifyContent: "center" },
  collage: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: radii.control,
    overflow: "hidden",
  },
});
