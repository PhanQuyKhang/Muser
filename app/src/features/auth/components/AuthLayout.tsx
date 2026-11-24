import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/shared/theme";
import { Icon, Screen, Text } from "@/shared/ui";
import { strings } from "@/shared/strings";

interface AuthLayoutProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Shows a back chevron (reset flow). */
  onBack?: () => void;
  /** Use the 32/45 hero heading (Log in) instead of the 30/42 display heading. */
  hero?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for the Auth screens: eyebrow, heading, description, form body, footer. */
export function AuthLayout({
  eyebrow,
  title,
  description,
  onBack,
  hero = false,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.common.back}
            hitSlop={8}
            onPress={onBack}
            style={styles.back}
          >
            <Icon name="chevronLeft" size={28} color="textPrimary" />
          </Pressable>
        ) : null}
        <View style={[styles.header, onBack ? styles.headerWithBack : null]}>
          {eyebrow ? (
            <Text variant="eyebrow" color="secondary">
              {eyebrow}
            </Text>
          ) : null}
          <Text variant={hero ? "hero" : "display"} accessibilityRole="header">
            {title}
          </Text>
          {description ? (
            <Text variant="body" color="textSecondary">
              {description}
            </Text>
          ) : null}
        </View>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  back: { width: 48, height: 48, justifyContent: "center", marginLeft: -spacing.sm },
  header: { marginTop: spacing.xxxl, gap: spacing.sm },
  headerWithBack: { marginTop: spacing.xl },
  body: { marginTop: spacing.xxl, gap: spacing.lg },
  footer: { marginTop: spacing.xl, paddingBottom: spacing.xl },
});
