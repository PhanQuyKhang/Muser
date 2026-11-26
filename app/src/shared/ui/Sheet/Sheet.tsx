import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Icon } from "../Icon";
import { Text } from "../Text";

export interface SheetProps {
  title: string;
  message?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet for choices and confirmations (O01-O09). Mount it only while it is open. */
export function Sheet({ title, message, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.common.close}
          style={styles.backdrop}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[styles.panel, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text variant="tileTitle" numberOfLines={2} style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.common.close}
              hitSlop={spacing.sm}
              onPress={onClose}
              style={styles.close}
            >
              <Icon name="close" size={sizes.iconSmall} color="textPrimary" />
            </Pressable>
          </View>
          {message ? (
            <Text variant="optionHint" color="textSecondary">
              {message}
            </Text>
          ) : null}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: colors.background, opacity: 0.7 },
  panel: {
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: sizes.pagePadding,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.disabled,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { flex: 1 },
  close: {
    width: sizes.sheetClose,
    height: sizes.sheetClose,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: sizes.sheetClose / 2,
    backgroundColor: colors.surfaceElevated,
  },
  scroll: { flexGrow: 0 },
  content: { gap: spacing.sm },
});
