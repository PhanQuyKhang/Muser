import { Pressable, StyleSheet, View } from "react-native";

import type { Song } from "@/domain/catalog";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { CoverArt, Icon, Text } from "@/shared/ui";

interface SongChoiceRowProps {
  song: Song;
  selected: boolean;
  /** True once the selection cap is reached and this row is not selected. */
  disabled?: boolean;
  onPress: () => void;
}

export function SongChoiceRow({ song, selected, disabled = false, onPress }: SongChoiceRowProps) {
  const artists = song.artistNames.join(", ");

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${song.title}, ${artists}`}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected, disabled && styles.rowDisabled]}
    >
      <CoverArt seed={song.albumId ?? song.id} label={song.title} size={42} />
      <View style={styles.text}>
        <Text variant="bodySmallStrong" numberOfLines={1}>
          {song.title}
        </Text>
        <Text variant="micro" color="textSecondary" numberOfLines={1}>
          {artists}
        </Text>
      </View>
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? <Icon name="check" size={14} color="onAccent" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.control,
    borderWidth: sizes.borderWidth,
    borderColor: "transparent",
    backgroundColor: colors.surface,
  },
  rowSelected: { borderColor: colors.secondary },
  rowDisabled: { opacity: 0.5 },
  text: { flex: 1, gap: 1 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.sm,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
});
