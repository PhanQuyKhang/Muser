import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { spacing } from "@/shared/theme";
import { Chip, ErrorState, Skeleton, Text } from "@/shared/ui";
import { ChoiceGrid } from "../components/ChoiceGrid";
import { OnboardingFooter } from "../components/OnboardingFooter";
import { OnboardingFrame } from "../components/OnboardingFrame";
import { useTags } from "../hooks/useCatalogChoices";
import { useOnboardingDraft } from "../onboarding.store";

const t = strings.onboarding.musicTypes;

/** S06: genre and mood chips that seed recommendations. */
export function MusicTypesScreen() {
  const tags = useTags();
  const selected = useOnboardingDraft((state) => state.tagIds);
  const toggleTag = useOnboardingDraft((state) => state.toggleTag);
  const clearTags = useOnboardingDraft((state) => state.clearTags);

  const genres = tags.data?.filter((tag) => tag.category === "genre") ?? [];
  const moods = tags.data?.filter((tag) => tag.category === "mood") ?? [];
  const next = () => router.push("/songs");

  return (
    <OnboardingFrame
      step={2}
      title={t.title}
      description={t.description}
      onBack={router.canGoBack() ? () => router.back() : undefined}
      onSkip={() => {
        clearTags();
        next();
      }}
      footer={<OnboardingFooter onContinue={next} />}
    >
      {tags.isError ? (
        <ErrorState onRetry={() => void tags.refetch()} />
      ) : tags.isLoading ? (
        <TagsSkeleton />
      ) : (
        <>
          <View style={styles.section}>
            <Text variant="songTitle">{t.genres}</Text>
            <ChoiceGrid>
              {genres.map((tag) => (
                <Chip
                  key={tag.id}
                  shape="tile"
                  label={tag.label}
                  selected={selected.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                />
              ))}
            </ChoiceGrid>
          </View>
          <View style={styles.section}>
            <Text variant="songTitle">{t.moods}</Text>
            <ChoiceGrid>
              {moods.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.label}
                  selected={selected.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                />
              ))}
            </ChoiceGrid>
          </View>
        </>
      )}
    </OnboardingFrame>
  );
}

function TagsSkeleton() {
  return (
    <View style={styles.section}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.skeletonRow}>
          {[0, 1, 2].map((column) => (
            <View key={column} style={styles.skeletonCell}>
              <Skeleton height={50} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  skeletonRow: { flexDirection: "row", gap: 9 },
  skeletonCell: { flex: 1 },
});
