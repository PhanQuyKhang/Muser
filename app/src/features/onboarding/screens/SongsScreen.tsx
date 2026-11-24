import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ONBOARDING_LIMITS } from "@/domain/onboarding";
import { strings } from "@/shared/strings";
import { spacing } from "@/shared/theme";
import { EmptyState, ErrorState, SearchField, Skeleton, Text } from "@/shared/ui";
import { OnboardingFooter } from "../components/OnboardingFooter";
import { OnboardingFrame } from "../components/OnboardingFrame";
import { SongChoiceRow } from "../components/SongChoiceRow";
import { useSongChoices } from "../hooks/useCatalogChoices";
import { useOnboardingDraft } from "../onboarding.store";

const t = strings.onboarding.songs;

/** S07: pick up to five favorite songs. Selections seed recommendations only; they are not likes. */
export function SongsScreen() {
  const [query, setQuery] = useState("");
  const choices = useSongChoices(query);
  const selected = useOnboardingDraft((state) => state.songIds);
  const toggleSong = useOnboardingDraft((state) => state.toggleSong);
  const clearSongs = useOnboardingDraft((state) => state.clearSongs);

  const full = selected.length >= ONBOARDING_LIMITS.songs;
  const next = () => router.push("/artists");

  return (
    <OnboardingFrame
      step={3}
      title={t.title}
      description={t.description}
      onBack={router.canGoBack() ? () => router.back() : undefined}
      onSkip={() => {
        clearSongs();
        next();
      }}
      pinned={
        <View style={styles.pinned}>
          <SearchField value={query} onChangeText={setQuery} placeholder={t.placeholder} />
          <View style={styles.header}>
            <Text variant="fieldLabel" color="textSecondary">
              {choices.searching ? t.results : t.suggested}
            </Text>
            <Text variant="microMedium" color="secondary" accessibilityLiveRegion="polite">
              {t.count(selected.length, ONBOARDING_LIMITS.songs)}
            </Text>
          </View>
        </View>
      }
      footer={<OnboardingFooter onContinue={next} />}
    >
      {choices.error ? (
        <ErrorState onRetry={choices.refetch} />
      ) : choices.loading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} height={58} />
          ))}
        </View>
      ) : choices.songs.length === 0 ? (
        <EmptyState title={t.noResults} />
      ) : (
        <View style={styles.list}>
          {choices.songs.map((song) => {
            const isSelected = selected.includes(song.id);
            return (
              <SongChoiceRow
                key={song.id}
                song={song}
                selected={isSelected}
                disabled={full && !isSelected}
                onPress={() => toggleSong(song.id)}
              />
            );
          })}
        </View>
      )}
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  pinned: { gap: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  list: { gap: spacing.sm - 2 },
});
