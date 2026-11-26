import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { meQueryKey } from "@/application/me-cache";
import { useServices } from "@/application/services";
import { useSessionStore } from "@/application/session";
import { ConfirmSheet } from "@/features/library/components/ConfirmSheet";
import { useSharing } from "@/features/social/hooks";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import {
  ErrorState,
  Icon,
  ListSkeleton,
  NavCard,
  PersonAvatar,
  TabHeader,
  Text,
} from "@/shared/ui";

const t = strings.account;

/** S20: who is signed in, Privacy, Activity and Sign out. */
export function AccountScreen() {
  const { auth, me } = useServices();
  const uid = useSessionStore((state) => state.user?.uid);
  const account = useQuery({ queryKey: meQueryKey(uid), queryFn: () => me.getMe() });
  const sharing = useSharing().query.data;
  const [asking, setAsking] = useState(false);
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
  const name = profile?.displayName ?? account.data?.email ?? "";

  return (
    <View style={styles.root}>
      <TabHeader title={t.title} subtitle={t.subtitle} />
      <ScrollView contentContainerStyle={styles.content}>
        {account.isError ? (
          <ErrorState onRetry={() => void account.refetch()} />
        ) : !account.data ? (
          <ListSkeleton rows={1} />
        ) : (
          <View style={styles.profile}>
            <PersonAvatar name={name} size={sizes.profileAvatar} own />
            <View style={styles.identity}>
              <Text variant="sheetTitle" numberOfLines={1}>
                {name}
              </Text>
              {profile ? (
                <Text variant="optionHint" color="textSecondary">
                  @{profile.username}
                </Text>
              ) : null}
              <Text variant="micro" color="textSecondary" numberOfLines={1}>
                {account.data.email}
              </Text>
            </View>
          </View>
        )}
        <Text variant="sectionTitle" style={styles.section}>
          {t.section}
        </Text>
        <NavCard
          title={t.privacy}
          subtitle={sharing ? t.privacyOn : t.privacyOff}
          leading={<Icon name="settings" color="primary" />}
          onPress={() => router.push("/account/privacy")}
        />
        <NavCard
          title={t.activity}
          subtitle={t.activityHint}
          leading={<Icon name="likedBadge" color="primary" />}
          onPress={() => router.push("/account/activity")}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.common.signOut}
          onPress={() => {
            setFailed(false);
            setAsking(true);
          }}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <Text variant="label" color="error">
            {strings.common.signOut}
          </Text>
        </Pressable>
      </ScrollView>
      {asking ? (
        <ConfirmSheet
          title={t.signOutTitle}
          message={t.signOutMessage}
          confirmLabel={strings.common.signOut}
          keepLabel={t.stay}
          busy={signingOut}
          failed={failed}
          onClose={() => setAsking(false)}
          onConfirm={() => void signOut()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.md },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg + 2,
    padding: spacing.lg + 2,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  identity: { flex: 1, gap: spacing.xs },
  section: { marginTop: spacing.xl },
  signOut: {
    height: sizes.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
});
