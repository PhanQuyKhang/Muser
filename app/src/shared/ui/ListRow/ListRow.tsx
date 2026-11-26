import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/shared/theme";
import { CoverArt } from "../CoverArt";
import { Text } from "../Text";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Adds a generated cover tile in front of the title. */
  coverSeed?: string;
  onPress: () => void;
}

/** A pressable navigation row (playlists, account menu entries). */
export function ListRow({ title, subtitle, coverSeed, onPress }: ListRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {coverSeed ? <CoverArt seed={coverSeed} label={title} size={48} /> : null}
      <View style={styles.text}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="micro" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.row,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  text: { flex: 1, gap: 1 },
});
