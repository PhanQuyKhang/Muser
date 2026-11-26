import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Text } from "@/shared/ui";
import { toneFor } from "@/shared/ui/CoverArt";
import type { Category } from "../categories";

/** Two-column tiles that open a genre or mood. */
export function BrowseGrid({ categories }: { categories: readonly Category[] }) {
  return (
    <View style={styles.grid}>
      {categories.map(({ tagId, name, color }) => (
        <Pressable
          key={tagId}
          accessibilityRole="button"
          accessibilityLabel={strings.search.browseLabel(name)}
          onPress={() => router.push({ pathname: "/search/browse/[tagId]", params: { tagId } })}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={[styles.art, { backgroundColor: toneFor(tagId) }]} />
          <Text variant="tileTitle" color={color}>
            {name}
          </Text>
          <Text variant="badge" color="textSecondary">
            {strings.search.browseTag}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    height: sizes.browseTile,
    justifyContent: "space-between",
    padding: spacing.lg - 2,
    borderRadius: radii.row + 2,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  art: {
    position: "absolute",
    right: -spacing.sm,
    bottom: -spacing.md,
    width: sizes.browseArt,
    height: sizes.browseArt,
    borderRadius: radii.badge,
    transform: [{ rotate: "12deg" }],
  },
  pressed: { opacity: 0.85 },
});
