import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ONBOARDING_LIMITS } from "@/domain/onboarding";
import { strings } from "@/shared/strings";
import { EmptyState, ErrorState, SearchField, Skeleton } from "@/shared/ui";
import { ArtistTile, MoreArtistsTile } from "../components/ArtistTile";
import { ChoiceGrid } from "../components/ChoiceGrid";
import { OnboardingFooter } from "../components/OnboardingFooter";
import { OnboardingFrame } from "../components/OnboardingFrame";
import { useArtistChoices } from "../hooks/useCatalogChoices";
import { useOnboardingDraft } from "../onboarding.store";

const t = strings.onboarding.artists;

/** S08: pick the artists you come back to (up to ten). */
export function ArtistsScreen() {
  const [query, setQuery] = useState("");
  const choices = useArtistChoices(query);
  const selected = useOnboardingDraft((state) => state.artistIds);
  const toggleArtist = useOnboardingDraft((state) => state.toggleArtist);
  const clearArtists = useOnboardingDraft((state) => state.clearArtists);

  const full = selected.length >= ONBOARDING_LIMITS.artists;
  const next = () => router.push("/sharing");

  return (
    <OnboardingFrame
      step={4}
      title={t.title}
      description={t.description}
      onBack={router.canGoBack() ? () => router.back() : undefined}
      onSkip={() => {
        clearArtists();
        next();
      }}
      pinned={<SearchField value={query} onChangeText={setQuery} placeholder={t.placeholder} />}
      footer={<OnboardingFooter onContinue={next} />}
    >
      {choices.error ? (
        <ErrorState onRetry={choices.refetch} />
      ) : choices.loading ? (
        <View style={styles.skeletons}>
          {[0, 1].map((row) => (
            <View key={row} style={styles.skeletonRow}>
              {[0, 1, 2].map((column) => (
                <View key={column} style={styles.skeletonCell}>
                  <Skeleton height={132} radius={22} />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : choices.artists.length === 0 ? (
        <EmptyState title={t.noResults} />
      ) : (
        <ChoiceGrid>
          {[
            ...choices.artists.map((artist) => {
              const isSelected = selected.includes(artist.id);
              return (
                <ArtistTile
                  key={artist.id}
                  artist={artist}
                  selected={isSelected}
                  disabled={full && !isSelected}
                  onPress={() => toggleArtist(artist.id)}
                />
              );
            }),
            ...(choices.hasMore
              ? [
                  <MoreArtistsTile
                    key="more"
                    label={t.findMore}
                    loading={choices.loadingMore}
                    onPress={choices.loadMore}
                  />,
                ]
              : []),
          ]}
        </ChoiceGrid>
      )}
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  skeletons: { gap: 9 },
  skeletonRow: { flexDirection: "row", gap: 9 },
  skeletonCell: { flex: 1 },
});
