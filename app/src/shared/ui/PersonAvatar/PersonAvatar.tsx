import { StyleSheet, View } from "react-native";

import { colors, sizes } from "@/shared/theme";
import { initialsOf } from "../Avatar";
import { Text } from "../Text";

const FILLS = [colors.secondary, colors.primary, colors.surprise] as const;

/** Initials on one of the three accents, the same accent for the same person every time. */
export function PersonAvatar({
  name,
  seed = name,
  size = sizes.personAvatar,
  own = false,
}: {
  name: string;
  /** Stable id used to choose the color. */
  seed?: string;
  size?: number;
  /** The signed-in user is always lavender. */
  own?: boolean;
}) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: own ? colors.primary : FILLS[hash % FILLS.length],
        },
      ]}
    >
      <Text variant={size >= sizes.profileAvatar ? "sheetTitle" : "label"} color="onAccent">
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ circle: { alignItems: "center", justifyContent: "center" } });
