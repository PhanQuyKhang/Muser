import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { meQueryKey } from "@/application/me-cache";
import { useServices } from "@/application/services";
import { useSessionStore } from "@/application/session";
import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Avatar, Button, ErrorState, Header, ListRow, ListSkeleton, Text } from "@/shared/ui";

const t = strings.account;

/** S20: who is signed in, Activity, Privacy and Sign out. */
export function AccountScreen() {
  const { auth, me } = useServices();
  const uid = useSessionStore((state) => state.user?.uid);
  const account = useQuery({ queryKey: meQueryKey(uid), queryFn: () => me.getMe() });
  const [signingOut, setSigningOut] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setSigningOut(true);
    setFailed(false);
    try {
      await auth.signOut();
      router.replace("/login");
    } catch {
      setFailed(true);
      setSigningOut(false);
    }
  }

  const profile = account.data?.profile;

  return (
    <View style={styles.root}>
      <Header title={t.title} />
      <ScrollView contentContainerStyle={styles.content}>
        {account.isError ? (
          <ErrorState onRetry={() => void account.refetch()} />
        ) : !account.data ? (
          <ListSkeleton rows={1} />
        ) : (
          <View style={styles.identity}>
            <Avatar name={profile?.displayName ?? account.data.email ?? ""} size={80} />
            {profile ? (
              <>
                <Text variant="sectionTitle">{profile.displayName}</Text>
                <Text variant="bodySmall" color="textSecondary">
                  @{profile.username}
                </Text>
              </>
            ) : null}
            <Text variant="bodySmall" color="textSecondary">
              {account.data.email}
            </Text>
          </View>
        )}
        <ListRow title={t.activity} onPress={() => router.push("/account/activity")} />
        <ListRow title={t.privacy} onPress={() => router.push("/account/privacy")} />
        {failed ? (
          <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
            {strings.common.actionFailed}
          </Text>
        ) : null}
        <Button
          label={strings.common.signOut}
          variant="destructive"
          loading={signingOut}
          onPress={() => void signOut()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.sm },
  identity: { alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
});
