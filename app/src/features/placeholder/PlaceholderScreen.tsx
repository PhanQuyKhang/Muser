import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { useServices } from "@/application/services";
import { strings } from "@/shared/strings";
import { spacing } from "@/shared/theme";
import { Button, Screen, Text } from "@/shared/ui";

/** Temporary stand-in for screens that are not built yet. Delete as each real screen lands. */
export function PlaceholderScreen({ title }: { title: string }) {
  const { auth } = useServices();

  async function signOut() {
    await auth.signOut();
    router.replace("/login");
  }

  return (
    <Screen style={styles.center}>
      <Text variant="titleLarge">{title}</Text>
      <Text variant="body" color="textSecondary">
        {strings.placeholder.comingSoon}
      </Text>
      <Button
        label={strings.common.signOut}
        variant="secondary"
        fullWidth={false}
        onPress={signOut}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: spacing.md },
});
