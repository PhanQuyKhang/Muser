import { StyleSheet, View } from "react-native";

import { colors } from "@/shared/theme";
import { FillImage } from "../FillImage";
import { Text } from "../Text";

export interface CoverArtProps {
  /** Stable seed (song, album or artist id) so the same item always gets the same color. */
  seed: string;
  /** Text shown on the tile (usually the first letter of the title). */
  label: string;
  size: number;
  /** Circular for artist portraits, rounded square for covers. */
  round?: boolean;
  /** The picture, shown over the tile once it loads. */
  uri?: string | null | undefined;
}

// Muted tones that sit on the dark UI; kept out of the theme because they are placeholder-only.
const TONES = ["#3A3566", "#2F4A52", "#5A3A55", "#3F4F37", "#51402F", "#34405E"] as const;

export function toneFor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length] ?? TONES[0];
}

/** A cover or portrait: the picture when there is one, over a colored tile with a letter. */
export function CoverArt({ seed, label, size, round = false, uri }: CoverArtProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: round ? size / 2 : Math.round(size * 0.19),
          backgroundColor: toneFor(seed),
        },
      ]}
    >
      <Text variant="label" style={{ color: colors.textPrimary, fontSize: Math.round(size * 0.4) }}>
        {label.trim().charAt(0).toUpperCase()}
      </Text>
      <FillImage uri={uri} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
