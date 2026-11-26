import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Button, EmptyState, ErrorState, Header, ListSkeleton, Text } from "@/shared/ui";
import { PersonRow } from "../components/PersonRow";
import { useFriendActions, useFriendRequests } from "../hooks";

const t = strings.friends;

/** S19: answer incoming requests, cancel outgoing ones. */
export function FriendRequestsScreen() {
  const requests = useFriendRequests();
  const { respond } = useFriendActions();
  const busy = respond.isPending;

  return (
    <View style={styles.root}>
      <Header title={t.requestsTitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {respond.isError ? (
          <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
            {strings.common.actionFailed}
          </Text>
        ) : null}
        {requests.isError ? (
          <ErrorState onRetry={() => void requests.refetch()} />
        ) : !requests.data ? (
          <ListSkeleton rows={3} />
        ) : requests.data.incoming.length + requests.data.outgoing.length === 0 ? (
          <EmptyState title={t.noRequests} />
        ) : (
          <>
            {requests.data.incoming.length > 0 ? (
              <Text variant="sectionTitle">{t.incoming}</Text>
            ) : null}
            {requests.data.incoming.map(({ pairId, profile }) => (
              <PersonRow key={pairId} profile={profile}>
                <Button
                  label={t.accept}
                  accessibilityLabel={t.acceptLabel(profile.displayName)}
                  size="sm"
                  fullWidth={false}
                  disabled={busy}
                  onPress={() => respond.mutate({ pairId, action: "accept" })}
                />
                <Button
                  label={t.decline}
                  accessibilityLabel={t.declineLabel(profile.displayName)}
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  disabled={busy}
                  onPress={() => respond.mutate({ pairId, action: "decline" })}
                />
              </PersonRow>
            ))}
            {requests.data.outgoing.length > 0 ? (
              <Text variant="sectionTitle">{t.outgoing}</Text>
            ) : null}
            {requests.data.outgoing.map(({ pairId, profile }) => (
              <PersonRow key={pairId} profile={profile}>
                <Text variant="bodySmall" color="textSecondary">
                  {t.pending}
                </Text>
                <Button
                  label={strings.common.cancel}
                  accessibilityLabel={t.cancelLabel(profile.displayName)}
                  variant="destructive"
                  size="sm"
                  fullWidth={false}
                  disabled={busy}
                  onPress={() => respond.mutate({ pairId, action: "cancel" })}
                />
              </PersonRow>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.sm },
});
