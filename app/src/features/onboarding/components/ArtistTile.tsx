import { Pressable, StyleSheet, View } from "react-native";

import type { Artist } from "@/domain/catalog";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { CoverArt, Icon, Text } from "@/shared/ui";

interface ArtistTileProps {
  artist: Artist;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function ArtistTile({ artist, selected, disabled = false, onPress }: ArtistTileProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={artist.name}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.tile, selected && styles.selected, disabled && styles.disabled]}
    >
      <View>
        <CoverArt seed={artist.id} label={artist.name} size={72} round />
        {selected ? (
          <View style={styles.badge}>
            <Icon name="check" size={12} color="onAccent" />
          </View>
        ) : null}
      </View>
      <Text variant="fieldLabel" numberOfLines={2} style={styles.name}>
        {artist.name}
      </Text>
    </Pressable>
  );
}

/** Last cell of the grid: loads the next page of artists. */
export function MoreArtistsTile({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={loading}
      onPress={onPress}
      style={styles.tile}
    >
      <View style={styles.more}>
        <Icon name="search" size={sizes.iconDefault} color="textSecondary" />
      </View>
      <Text variant="fieldLabel" color="textSecondary" style={styles.name}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.card,
    borderWidth: sizes.borderWidth,
    borderColor: "transparent",
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.secondary },
  disabled: { opacity: 0.5 },
  name: { textAlign: "center" },
  badge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  more: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
});
