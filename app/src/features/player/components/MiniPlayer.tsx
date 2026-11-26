import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import {
  isExploreQueue,
  useCurrentSong,
  usePlayerStore,
  useQueueEdges,
} from "@/application/player";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing, type ColorToken } from "@/shared/theme";
import { CoverArt, Icon, Text } from "@/shared/ui";
import type { IconName } from "@/shared/ui/Icon";
import { usePlayerProgress } from "../PlayerProvider";

const t = strings.player;

function MiniButton({
  icon,
  label,
  onPress,
  disabled = false,
  color = "textSecondary",
  size = sizes.iconDefault,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: ColorToken;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
    >
      <Icon name={icon} size={size} color={disabled ? "disabled" : color} />
    </Pressable>
  );
}

function Timeline() {
  const { position, duration } = usePlayerProgress();
  return (
    <View style={styles.timeline}>
      <View style={[styles.played, { width: `${Math.min(position / duration, 1) * 100}%` }]} />
    </View>
  );
}

/** The bar above the tab bar on every tab but Explore (Figma "Mini player"). */
export function MiniPlayer() {
  const song = useCurrentSong();
  const paused = usePlayerStore((state) => state.paused);
  const { setPaused, advance, back } = usePlayerStore.getState();
  const { canGoBack, canGoNext } = useQueueEdges();
  const onCard = usePlayerStore((state) => isExploreQueue(state.queue?.id ?? ""));
  if (!song) return null;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <CoverArt seed={song.albumId ?? song.id} label={song.title} size={sizes.miniArtwork} />
        {/* There is no full player yet: an Explore song opens its card. */}
        <Pressable
          accessibilityRole={onCard ? "button" : "text"}
          accessibilityLabel={onCard ? t.open(song.title) : song.title}
          disabled={!onCard}
          onPress={() => router.navigate("/explore")}
          style={styles.song}
        >
          <Text variant="miniTitle" numberOfLines={1}>
            {song.title}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {song.artistNames.join(", ")}
          </Text>
        </Pressable>
        <MiniButton icon="miniPrevious" label={t.previous} onPress={back} disabled={!canGoBack} />
        <MiniButton
          icon={paused ? "play" : "miniPause"}
          label={paused ? t.playLabel : t.pauseLabel}
          onPress={() => setPaused(!paused)}
          color="textPrimary"
          size={sizes.iconMiniToggle}
        />
        <MiniButton icon="miniNext" label={t.next} onPress={advance} disabled={!canGoNext} />
      </View>
      <Timeline />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: sizes.miniPlayerHeight,
    marginHorizontal: sizes.cardInset,
    marginBottom: spacing.sm,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    height: sizes.miniPlayerHeight - 4,
    paddingHorizontal: spacing.sm,
  },
  song: { flex: 1, height: sizes.touchTarget, justifyContent: "center", marginLeft: spacing.xs },
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  timeline: {
    height: 2,
    marginHorizontal: spacing.sm,
    marginTop: 1,
    borderRadius: 1,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  played: { height: 2, backgroundColor: colors.primary },
});
