import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { sizes, spacing } from "@/shared/theme";
import { Button, Text } from "@/shared/ui";
import { OnboardingFrame } from "../components/OnboardingFrame";
import { SharingPreview, SharingRule } from "../components/SharingPreview";
import { useCompleteOnboarding } from "../hooks/useCompleteOnboarding";

const t = strings.onboarding.sharing;

/**
 * S09: sharing consent, the last step. Either choice finishes setup; "Not now" is the default,
 * and Skip in the header means the same. Opening then routes to Explore.
 */
export function SharingScreen() {
  // Opening reads the freshly updated profile state and sends the user to Explore.
  const { submitting, error, complete } = useCompleteOnboarding(() => router.replace("/"));

  return (
    <OnboardingFrame
      step={5}
      title={t.title}
      description={t.description}
      onBack={router.canGoBack() ? () => router.back() : undefined}
      onSkip={() => void complete(false)}
      footer={
        <>
          {error ? (
            <Text variant="micro" color="error" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button
            size="lg"
            label={t.enable}
            loading={submitting === "enable"}
            disabled={submitting === "skip"}
            onPress={() => void complete(true)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.notNow}
            accessibilityState={{ disabled: submitting !== null }}
            disabled={submitting !== null}
            onPress={() => void complete(false)}
            style={styles.notNow}
          >
            <Text variant="body" color="textSecondary">
              {t.notNow}
            </Text>
          </Pressable>
        </>
      }
    >
      <SharingPreview />
      <View style={styles.rules}>
        <SharingRule icon="check" title={t.ruleShareTitle} body={t.ruleShareBody} />
        <SharingRule icon="circle" title={t.rulePrivateTitle} body={t.rulePrivateBody} />
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  rules: { gap: spacing.lg },
  notNow: { minHeight: sizes.touchTarget - 8, alignItems: "center", justifyContent: "center" },
});
