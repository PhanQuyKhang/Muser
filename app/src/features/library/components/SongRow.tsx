import { Pressable, StyleSheet, View } from "react-native";

import type { Song } from "@/domain/catalog";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { CoverArt, Icon, Text } from "@/shared/ui";

export interface SongRowProps {
  /** null when the catalog withdrew the song: the saved entry stays and can still be removed. */
  song: Song | null;
  songId: string;
  liked: boolean;
  likePending?: boolean;
  onToggleLike: () => void;
  onMore: () => void;
}

export function SongRow({
  song,
  songId,
  liked,
  likePending = false,
  onToggleLike,
  onMore,
}: SongRowProps) {
  const title = song?.title ?? strings.library.unavailableSong;
  const artists = song?.artistNames.join(", ") ?? "";

  return (
    <View style={styles.row}>
      <CoverArt seed={song?.albumId ?? songId} label={title} size={42} />
      <View style={styles.text}>
        <Text variant="bodySmallStrong" numberOfLines={1}>
          {title}
        </Text>
        {artists ? (
          <Text variant="micro" color="textSecondary" numberOfLines={1}>
            {artists}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          liked ? strings.library.unlikeLabel(title) : strings.library.likeLabel(title)
        }
        accessibilityState={{ selected: liked, busy: likePending }}
        disabled={likePending || (!song && !liked)}
        onPress={onToggleLike}
        style={styles.action}
      >
        <Icon
          name={liked ? "heartFilled" : "heart"}
          size={sizes.iconSmall}
          color={liked ? "secondary" : "textSecondary"}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.library.moreLabel(title)}
        onPress={onMore}
        style={styles.action}
      >
        <Icon name="more" size={sizes.iconSmall} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingLeft: spacing.sm,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  text: { flex: 1, gap: 1 },
  action: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing.md,
  },
});
