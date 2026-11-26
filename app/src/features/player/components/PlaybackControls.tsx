import { Pressable, StyleSheet, View } from "react-native";

import { usePlayerStore } from "@/application/player";
import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Button, Icon, Text } from "@/shared/ui";
import type { IconName } from "@/shared/ui/Icon";
import { usePlayerControls } from "../PlayerProvider";
import { SeekBar } from "./SeekBar";

const t = strings.player;
const SKIP_SECONDS = 10;
const BARS = [8, 17, 24, 13];

function SeekButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.button}
    >
      <Icon name={icon} size={sizes.iconSeek} color="textPrimary" />
      <Text variant="tick" color="textSecondary">
        {SKIP_SECONDS}
      </Text>
    </Pressable>
  );
}

/** Timeline and transport buttons for the card in front (Figma Explore frames). */
export function PlaybackControls() {
  const { state, seekBy, replay, retry } = usePlayerControls();
  const paused = usePlayerStore((s) => s.paused);
  const setPaused = usePlayerStore((s) => s.setPaused);
  const problem = state === "failed" ? t.failed : state === "missing" ? t.missing : null;

  return (
    <View>
      {problem === null ? (
        <SeekBar />
      ) : (
        <View style={styles.problem}>
          <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
            {problem}
          </Text>
          {state === "failed" ? (
            <Button
              label={strings.common.retry}
              variant="tertiary"
              size="sm"
              fullWidth={false}
              onPress={retry}
            />
          ) : null}
        </View>
      )}
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.replay}
          onPress={replay}
          style={styles.button}
        >
          <Icon name="replay" />
        </Pressable>
        <SeekButton icon="rewind" label={t.rewind} onPress={() => seekBy(-SKIP_SECONDS)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? t.playLabel : t.pauseLabel}
          accessibilityState={{ busy: state === "loading" }}
          onPress={() => setPaused(!paused)}
          style={[styles.button, styles.toggle]}
        >
          <Icon name={paused ? "play" : "pause"} color="onAccent" />
        </Pressable>
        <SeekButton icon="forward" label={t.forward} onPress={() => seekBy(SKIP_SECONDS)} />
        {/* Decorative: lit while sound is coming out. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.button, styles.bars, (paused || state !== "ready") && styles.idle]}
        >
          {BARS.map((height) => (
            <View key={height} style={[styles.bar, { height }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  problem: {
    alignItems: "center",
    justifyContent: "center",
    height: sizes.seekTouchHeight + sizes.timeRow,
    flexDirection: "row",
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "100%",
    maxWidth: sizes.controlsWidth,
  },
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  toggle: { borderRadius: sizes.touchTarget / 2, backgroundColor: colors.primary },
  bars: { flexDirection: "row", gap: 2 },
  bar: { width: 3, borderRadius: 2, backgroundColor: colors.secondary },
  idle: { opacity: 0.25 },
});
