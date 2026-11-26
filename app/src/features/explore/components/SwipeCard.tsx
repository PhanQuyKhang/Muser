import { useMemo, type ReactNode } from "react";
import { Animated, PanResponder, StyleSheet, useAnimatedValue } from "react-native";

/** Horizontal distance after which releasing counts as a swipe. */
export const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

/**
 * Drag the card: right likes, left skips, a short drag springs back. The Skip and Like
 * buttons under the card do the same, so a swipe is never the only way.
 */
export function SwipeCard({ children, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const x = useAnimatedValue(0);

  const responder = useMemo(() => {
    const springBack = () => Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
    return PanResponder.create({
      // Only claim clearly horizontal drags, so taps and vertical scrolling still work.
      onMoveShouldSetPanResponder: (_event, { dx, dy }) =>
        Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_event, { dx }) => x.setValue(dx),
      onPanResponderRelease: (_event, { dx }) => {
        if (Math.abs(dx) < SWIPE_THRESHOLD) {
          springBack();
          return;
        }
        x.setValue(0);
        if (dx > 0) onSwipeRight();
        else onSwipeLeft();
      },
      // Keep the drag once claimed; the surrounding ScrollView must not take it over.
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: springBack,
    });
  }, [x, onSwipeLeft, onSwipeRight]);

  const rotate = x.interpolate({ inputRange: [-200, 200], outputRange: ["-8deg", "8deg"] });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[styles.card, { transform: [{ translateX: x }, { rotate }] }]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ card: { alignSelf: "stretch" } });
