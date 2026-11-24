import { useEffect } from "react";
import { Animated, useAnimatedValue, type DimensionValue } from "react-native";

import { colors, radii } from "@/shared/theme";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/** Placeholder block for initial loads. Pulses gently; it is hidden from screen readers. */
export function Skeleton({ width = "100%", height = 16, radius = radii.control }: SkeletonProps) {
  const opacity = useAnimatedValue(0.5);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: colors.surfaceElevated,
        opacity,
      }}
    />
  );
}
