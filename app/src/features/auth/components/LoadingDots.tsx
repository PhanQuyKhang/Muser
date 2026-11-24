import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { colors, spacing } from "@/shared/theme";

const DOTS = 3;

/** Three-dot loading indicator from the Opening design; the active dot is lavender. */
export function LoadingDots() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((current) => (current + 1) % DOTS), 350);
    return () => clearInterval(timer);
  }, []);

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: DOTS }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: index === active ? colors.primary : colors.border },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
