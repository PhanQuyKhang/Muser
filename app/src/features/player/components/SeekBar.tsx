import { useState } from "react";
import { StyleSheet, View, type GestureResponderEvent } from "react-native";

import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Text } from "@/shared/ui";
import { usePlayerControls, usePlayerProgress } from "../PlayerProvider";

/** Seconds moved by one screen-reader adjustment. */
const STEP = 5;

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Draggable timeline with the elapsed time and the length underneath. */
export function SeekBar() {
  const { seekTo, seekBy } = usePlayerControls();
  const { position, duration } = usePlayerProgress();
  const [width, setWidth] = useState(0);
  // While a finger is down the bar follows it, not the audio.
  const [drag, setDrag] = useState<number | null>(null);

  /** Where on the bar the finger is, from 0 to 1. */
  const fraction = (event: GestureResponderEvent) =>
    width > 0 ? Math.min(Math.max(event.nativeEvent.locationX / width, 0), 1) : 0;

  const played = drag ?? Math.min(position / duration, 1);

  return (
    <View style={styles.root}>
      <View
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => setDrag(fraction(event))}
        onResponderMove={(event) => setDrag(fraction(event))}
        onResponderRelease={(event) => {
          seekTo(fraction(event) * duration);
          setDrag(null);
        }}
        onResponderTerminationRequest={() => false}
        onResponderTerminate={() => setDrag(null)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={strings.player.seek}
        accessibilityValue={{ text: formatTime(played * duration) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) =>
          seekBy(event.nativeEvent.actionName === "increment" ? STEP : -STEP)
        }
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={styles.touch}
      >
        {/* Children ignore touches, so `locationX` is measured from the bar itself. */}
        <View pointerEvents="none" style={styles.track}>
          <View style={[styles.fill, { width: `${played * 100}%` }]} />
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: `${played * 100}%` }]} />
      </View>
      <View style={styles.times}>
        <Text variant="captionMedium" color="textSecondary">
          {formatTime(played * duration)}
        </Text>
        <Text variant="captionMedium" color="textSecondary">
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const TOUCH_HEIGHT = sizes.seekTouchHeight;

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.xl },
  touch: { height: TOUCH_HEIGHT, justifyContent: "center" },
  track: {
    height: sizes.seekTrack,
    borderRadius: sizes.seekTrack,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: { height: sizes.seekTrack, backgroundColor: colors.primary },
  thumb: {
    position: "absolute",
    top: (TOUCH_HEIGHT - sizes.seekThumb) / 2,
    width: sizes.seekThumb,
    height: sizes.seekThumb,
    marginLeft: -sizes.seekThumb / 2,
    borderRadius: sizes.seekThumb / 2,
    backgroundColor: colors.textPrimary,
  },
  times: { flexDirection: "row", justifyContent: "space-between", minHeight: sizes.timeRow },
});
