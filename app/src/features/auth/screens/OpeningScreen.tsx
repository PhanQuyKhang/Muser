import { Redirect } from "expo-router";
import { useEffect } from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  StyleSheet,
  View,
  useAnimatedValue,
} from "react-native";

import { strings } from "@/shared/strings";
import { sizes, spacing } from "@/shared/theme";
import { ErrorState, Screen, Text } from "@/shared/ui";
import { LoadingDots } from "../components/LoadingDots";
import { useStartRoute } from "../hooks/useStartRoute";

// The only place the full logo is allowed (docs/MUSER_DESIGN.md §4).
const logo = require("../../../../assets/brand/logo_whole.png") as number;

/** S01: shows the logo while the session is restored, then routes on. Never leaves the logo hanging on failure. */
export function OpeningScreen() {
  const route = useStartRoute();
  const progress = useAnimatedValue(0);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) progress.setValue(1);
      else Animated.timing(progress, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [progress]);

  if (route.status === "ready") return <Redirect href={route.href} />;

  if (route.status === "error") {
    return (
      <Screen style={styles.center}>
        <ErrorState onRetry={route.retry} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.center}>
      <Animated.View
        style={[
          styles.brand,
          {
            opacity: progress,
            transform: [
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}
      >
        <Image source={logo} style={styles.logo} accessibilityLabel="Muser" />
        <Text variant="sectionTitle">{strings.opening.tagline}</Text>
      </Animated.View>
      <View style={styles.dots} accessibilityLabel={strings.opening.loading} accessible>
        <LoadingDots />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  brand: { alignItems: "center", gap: spacing.xl },
  logo: { width: 258, height: 258 },
  dots: { position: "absolute", bottom: sizes.bottomNavHeight + spacing.xl, left: 0, right: 0 },
});
