import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { meQueryKey } from "@/application/me-cache";
import { useServices } from "@/application/services";
import { useSessionStore } from "@/application/session";
import { normalizeUsername, validateUsername } from "@/domain/profile-validation";
import type { FoundUser } from "@/domain/social";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import {
  Button,
  DetailHeader,
  EmptyState,
  ErrorState,
  ListSkeleton,
  PersonAvatar,
  SearchField,
  Text,
} from "@/shared/ui";
import { socialKeys, useFriendActions } from "../hooks";

const t = strings.friends;

/** S18: exact username search, then Add friend or the current relationship. */
export function FindFriendsScreen() {
  const { social, me } = useServices();
  const uid = useSessionStore((state) => state.user?.uid);
  const account = useQuery({ queryKey: meQueryKey(uid), queryFn: () => me.getMe() });
  const [text, setText] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const result = useQuery({
    queryKey: [...socialKeys.all, "user", username],
    queryFn: () => social.findUser(username!),
    enabled: username !== null,
  });
  const actions = useFriendActions();
  const valid = validateUsername(normalizeUsername(text)) === null;
  const mine = account.data?.profile?.username;

  const search = () => {
    if (!valid) return;
    actions.send.reset();
    setUsername(normalizeUsername(text));
  };

  return (
    <View style={styles.root}>
      <DetailHeader title={t.findTitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {username === null ? (
          <View style={styles.intro}>
            <Text variant="headline">{t.findHeadline}</Text>
            <Text variant="body" color="textSecondary">
              {t.findBody}
            </Text>
          </View>
        ) : null}
        <SearchField
          label={t.usernameLabel}
          value={text}
          onChangeText={(value) => {
            setText(value);
            setUsername(null);
          }}
          onSubmit={search}
          placeholder={t.usernamePlaceholder}
        />
        {username === null ? (
          <>
            <Text variant="micro" color="textSecondary">
              {t.usernameHelper}
            </Text>
            <Button label={t.search} disabled={!valid} onPress={search} />
            {mine ? (
              <View style={styles.mine}>
                <Text variant="badge" color="secondary">
                  {t.yourUsername}
                </Text>
                <Text variant="tileTitle">@{mine}</Text>
              </View>
            ) : null}
            <Text variant="micro" color="textSecondary">
              {t.privacyNote}
            </Text>
          </>
        ) : result.isError ? (
          <ErrorState onRetry={() => void result.refetch()} />
        ) : result.data === undefined ? (
          <ListSkeleton rows={1} />
        ) : result.data === null ? (
          <EmptyState title={t.notFound} />
        ) : (
          <>
            <Text variant="eyebrow" color="textSecondary">
              {t.match}
            </Text>
            <View style={styles.match}>
              <PersonAvatar
                name={result.data.profile.displayName}
                seed={result.data.profile.uid}
                size={sizes.profileAvatar}
              />
              <Text variant="sectionTitle">{result.data.profile.displayName}</Text>
              <Text variant="optionHint" color="textSecondary">
                @{result.data.profile.username}
              </Text>
              <View style={styles.relation}>
                <Relation
                  user={result.data}
                  sending={actions.send.isPending}
                  onAdd={(name) => actions.send.mutate(name)}
                />
              </View>
            </View>
          </>
        )}
        {actions.send.isError ? (
          <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
            {strings.common.actionFailed}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Relation({
  user,
  sending,
  onAdd,
}: {
  user: FoundUser;
  sending: boolean;
  onAdd: (username: string) => void;
}) {
  if (user.relationship === "none") {
    return <Button label={t.add} loading={sending} onPress={() => onAdd(user.profile.username)} />;
  }
  if (user.relationship === "incoming") {
    return <Button label={t.answerRequest} onPress={() => router.push("/friends/requests")} />;
  }
  return (
    <Text variant="bodySmallStrong" color="secondary" style={styles.status}>
      {t.relationship[user.relationship]}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.md },
  intro: { gap: spacing.md, marginVertical: spacing.lg },
  mine: {
    gap: spacing.sm,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radii.row,
    backgroundColor: colors.surface,
  },
  match: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  relation: { alignSelf: "stretch", marginTop: spacing.md },
  status: { textAlign: "center" },
});
