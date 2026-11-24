import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { Button, Input, Text } from "@/shared/ui";
import { AuthFooter } from "../components/AuthFooter";
import { AuthLayout } from "../components/AuthLayout";
import { useLoginForm } from "../hooks/useLoginForm";

const t = strings.auth;

export function LoginScreen() {
  // Opening decides where a signed-in user lands (setup vs Explore).
  const form = useLoginForm(() => router.replace("/"));

  return (
    <AuthLayout
      hero
      eyebrow={t.login.eyebrow}
      title={t.login.title}
      description={t.login.description}
      footer={
        <AuthFooter
          copy={t.login.footerCopy}
          linkLabel={t.login.footerLink}
          onPress={() => router.push("/signup")}
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
        placeholder={t.fields.passwordPlaceholder}
        value={form.password}
        onChangeText={form.setPassword}
        error={form.errors.password}
        autoCapitalize="none"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={form.submit}
        editable={!form.submitting}
      />
      <View style={styles.forgotRow}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t.login.forgot}
          hitSlop={8}
          onPress={() => router.push("/reset-password")}
          style={styles.forgot}
        >
          <Text variant="fieldLabel" color="primary">
            {t.login.forgot}
          </Text>
        </Pressable>
      </View>
      {form.errors.form ? (
        <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
          {form.errors.form}
        </Text>
      ) : null}
      <Button label={t.login.submit} onPress={form.submit} loading={form.submitting} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgotRow: { alignItems: "flex-end" },
  forgot: { minHeight: 44, justifyContent: "center" },
});
