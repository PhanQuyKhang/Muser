import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
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
          <View style={styles.header}>
            <Text variant="sectionTitle">{title}</Text>
            {message ? (
              <Text variant="bodySmall" color="textSecondary">
                {message}
              </Text>
            ) : null}
          </View>
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
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  header: { gap: spacing.xs },
  scroll: { flexGrow: 0 },
  content: { gap: spacing.sm },
});
