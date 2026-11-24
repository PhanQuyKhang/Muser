import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ONBOARDING_STEPS } from "@/domain/onboarding";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Icon, Screen, Text } from "@/shared/ui";

interface OnboardingFrameProps {
  /** 1-based position in the five-step flow. */
  step: number;
  title: string;
  description: string;
  /** Hidden when there is nothing to go back to (first step, or resumed mid-flow). */
  onBack?: (() => void) | undefined;
  /** Shows "Skip" in the header. Without it the header shows "n of 5". */
  onSkip?: (() => void) | undefined;
  /** Content above the scrolling body that must stay put, such as a search field. */
  pinned?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared frame for the five setup screens: step header, progress, intro copy, body, footer. */
export function OnboardingFrame({
  step,
  title,
  description,
  onBack,
  onSkip,
  pinned,
  children,
  footer,
}: OnboardingFrameProps) {
  const t = strings.onboarding;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.side}>
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
          </View>
          <Text variant="eyebrow" color="textSecondary">
            {t.stepLabel}
          </Text>
          <View style={[styles.side, styles.sideEnd]}>
            {onSkip ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.skip}
                hitSlop={8}
                onPress={onSkip}
                style={styles.skip}
              >
                <Text variant="fieldLabel">{t.skip}</Text>
              </Pressable>
            ) : (
              <Text variant="fieldLabel" color="textSecondary">
                {t.stepOf(step, ONBOARDING_STEPS)}
              </Text>
            )}
          </View>
        </View>

        <StepProgress step={step} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text variant="display" accessibilityRole="header">
              {title}
            </Text>
            <Text variant="body" color="textSecondary">
              {description}
            </Text>
          </View>
          {pinned}
          {children}
        </ScrollView>

        <View style={styles.footer}>{footer}</View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function StepProgress({ step }: { step: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={strings.onboarding.stepOf(step, ONBOARDING_STEPS)}
      accessibilityValue={{ min: 1, max: ONBOARDING_STEPS, now: step }}
      style={styles.progress}
    >
      {Array.from({ length: ONBOARDING_STEPS }, (_, index) => (
        <View
          key={index}
          style={[styles.segment, index < step ? styles.segmentDone : styles.segmentTodo]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: sizes.touchTarget,
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: { width: 72, justifyContent: "center" },
  sideEnd: { alignItems: "flex-end" },
  back: { width: sizes.touchTarget, height: sizes.touchTarget, justifyContent: "center" },
  skip: { minHeight: sizes.touchTarget, justifyContent: "center", paddingLeft: spacing.lg },
  progress: { flexDirection: "row", gap: spacing.xs + 2, marginTop: spacing.md },
  segment: { flex: 1, height: 4, borderRadius: radii.pill },
  segmentDone: { backgroundColor: colors.primary },
  segmentTodo: { backgroundColor: colors.border },
  content: { paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: spacing.lg },
  intro: { gap: spacing.md },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
});
