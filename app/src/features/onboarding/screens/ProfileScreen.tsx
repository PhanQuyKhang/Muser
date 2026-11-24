import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { spacing } from "@/shared/theme";
import { Avatar, Input, Text } from "@/shared/ui";
import { OnboardingFooter } from "../components/OnboardingFooter";
import { OnboardingFrame } from "../components/OnboardingFrame";
import { useProfileForm } from "../hooks/useProfileForm";

const t = strings.onboarding.profile;

/** S05: display name and username. Creates the profile; the username cannot change afterwards. */
export function ProfileScreen() {
  const form = useProfileForm(() => router.push("/music-types"));
  const { usernameFeedback } = form;

  return (
    <OnboardingFrame
      step={1}
      title={t.title}
      description={t.description}
      footer={
        <>
          {form.submitError ? (
            <Text variant="micro" color="error" accessibilityLiveRegion="polite">
              {form.submitError}
            </Text>
          ) : null}
          <OnboardingFooter
            onContinue={form.submit}
            disabled={!form.canContinue}
            loading={form.submitting}
          />
        </>
      }
    >
      <View style={styles.avatar}>
        <Avatar name={form.displayName || "?"} size={76} />
      </View>
      <View style={styles.fields}>
        <Input
          label={t.displayName}
          placeholder={t.displayNamePlaceholder}
          helper={t.displayNameHelper}
          value={form.displayName}
          onChangeText={form.setDisplayName}
          error={form.displayNameError}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          maxLength={40}
          editable={!form.submitting}
        />
        <Input
          label={t.username}
          placeholder={t.usernamePlaceholder}
          value={form.username}
          onChangeText={form.setUsername}
          {...(usernameFeedback.tone === "error"
            ? { error: usernameFeedback.text }
            : {
                helper: usernameFeedback.text,
                helperColor: usernameFeedback.tone === "success" ? "secondary" : "textSecondary",
              })}
          autoCapitalize="none"
          autoComplete="username-new"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={form.submit}
          maxLength={20}
          editable={!form.submitting}
        />
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: "center", marginVertical: spacing.sm },
  fields: { gap: spacing.lg },
});
