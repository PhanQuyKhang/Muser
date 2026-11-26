import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useServices } from "@/application/services";
import { DISCOVERY_LEVELS, type DiscoveryLevel } from "@/domain/discovery";
import { useSharing } from "@/features/social/hooks";
import { strings } from "@/shared/strings";
import { sizes, spacing } from "@/shared/theme";
import { Button, ErrorState, ListSkeleton, Sheet, Text } from "@/shared/ui";
import { Deck } from "../components/Deck";

const t = strings.explore;
const KEY = ["recommendations"] as const;

/** S10 with O01: personal recommendations at the chosen discovery level. */
export function MyExplore() {
  const { discovery } = useServices();
  const queryClient = useQueryClient();
  const sharing = useSharing();
  const [level, setLevel] = useState<DiscoveryLevel | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  const [choice, setChoice] = useState<DiscoveryLevel>("explore");
  const query = useQuery({
    queryKey: [...KEY, level ?? "saved"],
    queryFn: () => discovery.recommend(level),
    placeholderData: keepPreviousData,
    // The deck must not reshuffle while the listener is going through it.
    staleTime: Infinity,
  });
  const applied = level ?? query.data?.level;

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Button
          label={applied ? t.levelButton(t.levels[applied].name) : t.levelTitle}
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={() => {
            setChoice(applied ?? "explore");
            setPicking(true);
          }}
        />
        {sharing.query.data !== undefined ? (
          <Button
            label={sharing.query.data ? t.sharingOn : t.sharingOff}
            variant="tertiary"
            size="sm"
            fullWidth={false}
            onPress={() => router.push("/account/privacy")}
          />
        ) : null}
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !query.data ? (
        <ListSkeleton />
      ) : (
        <Deck
          key={query.data.level}
          cards={query.data.songs.map((song) => ({ song }))}
          source="my_explore"
          onRestart={() => void queryClient.resetQueries({ queryKey: KEY })}
        />
      )}

      {picking ? (
        <Sheet title={t.levelTitle} onClose={() => setPicking(false)}>
          {DISCOVERY_LEVELS.map((option) => (
            <View key={option} style={styles.option}>
              <Button
                label={t.levels[option].name}
                variant={choice === option ? "primary" : "secondary"}
                onPress={() => setChoice(option)}
              />
              <Text variant="micro" color="textSecondary">
                {t.levels[option].hint}
              </Text>
            </View>
          ))}
          <Button
            label={t.apply}
            variant="like"
            onPress={() => {
              setLevel(choice);
              setPicking(false);
            }}
          />
        </Sheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: sizes.pagePadding,
    marginBottom: spacing.md,
  },
  option: { gap: spacing.xs },
});
