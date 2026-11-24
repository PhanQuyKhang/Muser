import { StyleSheet } from "react-native";

import { strings } from "@/shared/strings";
import { Button, Text } from "@/shared/ui";

interface OnboardingFooterProps {
  onContinue: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

/** Continue button plus the reassurance line shared by steps 1-4. */
export function OnboardingFooter({
  onContinue,
  disabled = false,
  loading = false,
  label = strings.common.continue,
}: OnboardingFooterProps) {
  return (
    <>
      <Button size="lg" label={label} onPress={onContinue} disabled={disabled} loading={loading} />
      <Text variant="micro" color="textSecondary" style={styles.hint}>
        {strings.onboarding.footerHint}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  hint: { textAlign: "center" },
});
