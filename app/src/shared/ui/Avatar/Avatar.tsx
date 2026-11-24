import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { colors } from "@/shared/theme";
import { Text } from "../Text";

export interface AvatarProps {
  /** Display name, used for the initials fallback and the accessible name. */
  name: string;
  uri?: string | null | undefined;
  size?: number;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Photo avatar with an initials fallback (no photo, or the image fails to load). */
export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;
  const frame = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[styles.frame, frame]}
    >
      {showImage ? (
        <Image source={{ uri: uri! }} onError={() => setFailed(true)} style={frame} />
      ) : (
        <Text variant="label" color="textPrimary" style={{ fontSize: Math.round(size * 0.38) }}>
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.surfaceElevated,
  },
});
