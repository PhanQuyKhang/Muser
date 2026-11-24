import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { colors, spacing } from "@/shared/theme";
import { strings } from "@/shared/strings";
import { Button, Icon, Input, Screen, Text } from "@/shared/ui";
import { AuthFooter } from "../components/AuthFooter";
import { AuthLayout } from "../components/AuthLayout";
import { useResetPasswordForm } from "../hooks/useResetPasswordForm";

const t = strings.auth;
const backToLogin = () => router.replace("/login");

export function ResetPasswordScreen() {
  const form = useResetPasswordForm();

  if (form.sentTo) return <ResetSent email={form.sentTo} />;

  return (
    <AuthLayout
      eyebrow={t.reset.eyebrow}
      title={t.reset.title}
      description={t.reset.description}
      onBack={() => router.back()}
      footer={
        <AuthFooter
          copy={t.reset.footerCopy}
          linkLabel={t.reset.footerLink}
          onPress={backToLogin}
        />
      }
    >
      <Input
        label={t.fields.email}
        placeholder={t.fields.emailPlaceholder}
        value={form.email}
        onChangeText={form.setEmail}
        error={form.error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={form.submit}
        editable={!form.submitting}
      />
      <Button label={t.reset.submit} onPress={form.submit} loading={form.submitting} />
    </AuthLayout>
  );
}

/** "Check your inbox" confirmation (Figma: Auth / Reset link sent). */
function ResetSent({ email }: { email: string }) {
  return (
    <Screen scroll>
      <View style={styles.sent}>
        <View style={styles.iconCircle}>
          <Icon name="mail" size={38} color="primary" />
        </View>
        <Text variant="titleLarge" accessibilityRole="header" style={styles.center}>
          {t.resetSent.title}
        </Text>
        <Text variant="bodySmall" color="textSecondary" style={styles.center}>
          {t.resetSent.description(email)}
        </Text>
        <View style={styles.action}>
          <Button label={t.resetSent.action} onPress={backToLogin} />
        </View>
        <Text variant="caption" color="textSecondary" style={styles.center}>
          {t.resetSent.help}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sent: { flex: 1, justifyContent: "center", alignItems: "stretch", gap: spacing.md },
  iconCircle: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  center: { textAlign: "center" },
  action: { marginTop: spacing.lg },
});
