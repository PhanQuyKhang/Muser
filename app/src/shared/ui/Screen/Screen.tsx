import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, sizes } from "@/shared/theme";

export interface ScreenProps {
  children: ReactNode;
  /** Scrolls the content (forms, long lists of sections). Default: fixed layout. */
  scroll?: boolean;
  /** Reserve space for the 5-tab bar when the screen is not inside the tab navigator. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Page container: background, safe-area insets and the standard horizontal padding. */
export function Screen({ children, scroll = false, padded = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const frame = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingHorizontal: padded ? sizes.pagePadding : 0,
  };

  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[frame, styles.grow, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.root, frame, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  grow: { flexGrow: 1 },
});
