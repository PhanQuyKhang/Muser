import { router } from "expo-router";

import { strings } from "@/shared/strings";
import { Button, Input, Text } from "@/shared/ui";
import { AuthFooter } from "../components/AuthFooter";
import { AuthLayout } from "../components/AuthLayout";
import { useSignUpForm } from "../hooks/useSignUpForm";

const t = strings.auth;

export function SignUpScreen() {
  const form = useSignUpForm(() => router.replace("/"));

  return (
    <AuthLayout
      eyebrow={t.signUp.eyebrow}
      title={t.signUp.title}
      description={t.signUp.description}
      footer={
        <AuthFooter
          copy={t.signUp.footerCopy}
          linkLabel={t.signUp.footerLink}
          onPress={() => router.replace("/login")}
        />
      }
    >
      <Input
        label={t.fields.email}
        placeholder={t.fields.emailPlaceholder}
        value={form.email}
        onChangeText={form.setEmail}
        error={form.errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        returnKeyType="next"
        editable={!form.submitting}
      />
      <Input
        secure
        label={t.fields.password}
        placeholder={t.fields.newPasswordPlaceholder}
        helper={t.fields.passwordHelper}
        value={form.password}
        onChangeText={form.setPassword}
        error={form.errors.password}
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="next"
        editable={!form.submitting}
      />
      <Input
        secure
        label={t.fields.confirmPassword}
        placeholder={t.fields.confirmPlaceholder}
        value={form.confirm}
        onChangeText={form.setConfirm}
        error={form.errors.confirm}
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={form.submit}
        editable={!form.submitting}
      />
      {form.errors.form ? (
        <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
          {form.errors.form}
        </Text>
      ) : null}
      <Button label={t.signUp.submit} onPress={form.submit} loading={form.submitting} />
    </AuthLayout>
  );
}
