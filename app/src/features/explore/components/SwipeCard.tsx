import { useMemo, type ReactNode } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  useAnimatedValue,
  useWindowDimensions,
} from "react-native";

import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Icon, Text } from "@/shared/ui";

/** Horizontal distance after which releasing counts as a swipe. */
export const SWIPE_THRESHOLD = 100;
const EXIT_MS = 180;

interface SwipeCardProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

/**
 * Drag the card: right likes, left skips, a short drag springs back. A badge names the
 * outcome while dragging. The Skip and Like buttons do the same, so a swipe is never the
 * only way. Mount one per song, with the song as its key.
 */
export function SwipeCard({ children, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const x = useAnimatedValue(0);
  const { width } = useWindowDimensions();

  const responder = useMemo(() => {
    const springBack = () => Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
    return PanResponder.create({
      // Only claim clearly horizontal drags, so taps on the card still work.
      onMoveShouldSetPanResponder: (_event, { dx, dy }) =>
        Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_event, { dx }) => x.setValue(dx),
      onPanResponderRelease: (_event, { dx }) => {
        if (Math.abs(dx) < SWIPE_THRESHOLD) {
          springBack();
          return;
        }
        Animated.timing(x, {
          toValue: Math.sign(dx) * width * 1.3,
          duration: EXIT_MS,
          useNativeDriver: false,
        }).start(() => (dx > 0 ? onSwipeRight() : onSwipeLeft()));
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: springBack,
    });
  }, [x, width, onSwipeLeft, onSwipeRight]);

  const rotate = x.interpolate({ inputRange: [-200, 200], outputRange: ["-7deg", "7deg"] });
  const likeOpacity = x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const skipOpacity = x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[styles.card, { transform: [{ translateX: x }, { rotate }] }]}
    >
      {children}
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[styles.badge, styles.like, { opacity: likeOpacity }]}
      >
        <Icon name="verdictLike" size={23} color="onAccent" />
        <Text variant="verdict" color="onAccent">
          {strings.explore.verdictLike}
        </Text>
      </Animated.View>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[styles.badge, styles.skip, { opacity: skipOpacity }]}
      >
        <View>
          <Icon name="verdictSkip" size={23} color="textPrimary" />
        </View>
        <Text variant="verdict">{strings.explore.verdictSkip}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  badge: {
    position: "absolute",
    top: spacing.xxl,
    width: sizes.verdictWidth,
    height: sizes.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.badge,
    borderWidth: 2,
  },
  like: { left: spacing.xl, backgroundColor: colors.secondary, borderColor: colors.secondary },
  skip: {
    right: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.textSecondary,
  },
});
