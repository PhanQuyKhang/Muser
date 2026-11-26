import { Pressable, StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors, radii, spacing } from "@/shared/theme";
import { CoverArt, Text } from "@/shared/ui";
import type { ArtistSummary } from "../hooks";

export function ArtistCard({ artist, onPress }: { artist: ArtistSummary; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${artist.name}, ${strings.search.artist}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <CoverArt seed={artist.id} label={artist.name} size={68} round />
      <View style={styles.text}>
        <Text variant="sectionTitle" numberOfLines={1}>
          {artist.name}
        </Text>
        <Text variant="optionHint" color="textSecondary">
          {strings.search.artist}
        </Text>
      </View>
      <Text variant="chevron" color="textSecondary">
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.row + 2,
    backgroundColor: colors.surface,
  },
  text: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.85 },
});
