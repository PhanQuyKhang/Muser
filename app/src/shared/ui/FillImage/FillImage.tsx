import { useState } from "react";
import { Image, StyleSheet } from "react-native";

/**
 * A picture covering its parent, over whatever the parent already draws. Renders nothing
 * without a link or when it cannot be loaded, so the fallback underneath stays visible.
 */
export function FillImage({ uri }: { uri: string | null | undefined }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!uri || failed === uri) return null;

  return (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri }}
      onError={() => setFailed(uri)}
      resizeMode="cover"
      style={styles.image}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
});
