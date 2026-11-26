import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { PublicProfile } from "@/domain/social";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import {
  Button,
  DetailHeader,
  EmptyState,
  ErrorState,
  ListSkeleton,
  PersonAvatar,
  Segmented,
  Text,
} from "@/shared/ui";
import { useFriendActions, useFriendRequests } from "../hooks";

const t = strings.friends;
type Box = "received" | "sent";

function RequestCard({ profile, children }: { profile: PublicProfile; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.person}>
        <PersonAvatar name={profile.displayName} seed={profile.uid} />
        <View style={styles.identity}>
          <Text variant="optionTitle" numberOfLines={1}>
            {profile.displayName}
          </Text>
          <Text variant="micro" color="textSecondary" numberOfLines={1}>
            @{profile.username}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

/** S19: answer incoming requests, cancel outgoing ones. */
export function FriendRequestsScreen() {
  const requests = useFriendRequests();
  const { respond } = useFriendActions();
  const [box, setBox] = useState<Box>("received");
  const busy = respond.isPending;
  const incoming = requests.data?.incoming ?? [];
  const outgoing = requests.data?.outgoing ?? [];
  const received = box === "received";
  const list = received ? incoming : outgoing;

  return (
    <View style={styles.root}>
      <DetailHeader title={t.requestsTitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="body" color="textSecondary">
          {t.requestsSubtitle}
        </Text>
        <Segmented
          options={[
            { id: "received", label: t.received, count: incoming.length },
            { id: "sent", label: t.sent, count: outgoing.length },
          ]}
          selected={box}
          onSelect={setBox}
        />
        {respond.isError ? (
          <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
            {strings.common.actionFailed}
          </Text>
        ) : null}
        {requests.isError ? (
          <ErrorState onRetry={() => void requests.refetch()} />
        ) : !requests.data ? (
          <ListSkeleton rows={3} />
        ) : list.length === 0 ? (
          <EmptyState title={received ? t.noRequests : t.noSent} />
        ) : (
          <>
            <Text variant="optionHint" color="textSecondary">
              {received ? t.waiting(list.length) : t.sentCount(list.length)}
            </Text>
            {list.map(({ pairId, profile }) => (
              <RequestCard key={pairId} profile={profile}>
                {received ? (
                  <>
                    <View style={styles.action}>
                      <Button
                        label={t.accept}
                        accessibilityLabel={t.acceptLabel(profile.displayName)}
                        size="sm"
                        disabled={busy}
                        onPress={() => respond.mutate({ pairId, action: "accept" })}
                      />
                    </View>
                    <View style={styles.action}>
                      <Button
                        label={t.decline}
                        accessibilityLabel={t.declineLabel(profile.displayName)}
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onPress={() => respond.mutate({ pairId, action: "decline" })}
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.action}>
                    <Button
                      label={t.cancelRequest}
                      accessibilityLabel={t.cancelLabel(profile.displayName)}
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onPress={() => respond.mutate({ pairId, action: "cancel" })}
                    />
                  </View>
                )}
              </RequestCard>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    gap: spacing.md,
    padding: spacing.lg - 2,
    borderRadius: radii.row + 2,
    backgroundColor: colors.surface,
  },
  person: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  identity: { flex: 1, gap: 3 },
  actions: { flexDirection: "row", gap: spacing.md },
  action: { flex: 1 },
});
