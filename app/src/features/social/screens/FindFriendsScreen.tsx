import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useServices } from "@/application/services";
import { normalizeUsername, validateUsername } from "@/domain/profile-validation";
import type { FoundUser } from "@/domain/social";
import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Button, EmptyState, ErrorState, Header, Input, ListSkeleton, Text } from "@/shared/ui";
import { PersonRow } from "../components/PersonRow";
import { socialKeys, useFriendActions } from "../hooks";

const t = strings.friends;

/** S18: exact username search, then Add friend or the current relationship. */
export function FindFriendsScreen() {
  const { social } = useServices();
  const [text, setText] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const result = useQuery({
    queryKey: [...socialKeys.all, "user", username],
    queryFn: () => social.findUser(username!),
    enabled: username !== null,
  });
  const actions = useFriendActions();
  const valid = validateUsername(normalizeUsername(text)) === null;

  const search = () => {
    if (!valid) return;
    actions.send.reset();
    setUsername(normalizeUsername(text));
  };

  return (
    <View style={styles.root}>
      <Header title={t.findTitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label={t.usernameLabel}
          value={text}
          onChangeText={setText}
          placeholder={t.usernamePlaceholder}
          helper={t.usernameHelper}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={search}
          maxLength={20}
        />
        <Button label={t.search} disabled={!valid} onPress={search} />
        {username === null ? null : result.isError ? (
          <ErrorState onRetry={() => void result.refetch()} />
        ) : result.data === undefined ? (
          <ListSkeleton rows={1} />
        ) : result.data === null ? (
          <EmptyState title={t.notFound} />
        ) : (
          <PersonRow profile={result.data.profile}>
            <Relation
              user={result.data}
              sending={actions.send.isPending}
              onAdd={(name) => actions.send.mutate(name)}
            />
          </PersonRow>
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
    return (
      <Button
        label={t.add}
        size="sm"
        fullWidth={false}
        loading={sending}
        onPress={() => onAdd(user.profile.username)}
      />
    );
  }
  if (user.relationship === "incoming") {
    return (
      <Button
        label={t.answerRequest}
        size="sm"
        fullWidth={false}
        onPress={() => router.push("/friends/requests")}
      />
    );
  }
  return (
    <Text variant="bodySmallStrong" color="secondary">
      {t.relationship[user.relationship]}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.md },
});
