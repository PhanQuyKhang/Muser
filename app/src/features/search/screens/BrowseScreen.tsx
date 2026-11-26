import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { SongList } from "@/features/library/components/SongList";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { EmptyState, ErrorState, ListSkeleton, TabHeader, Text } from "@/shared/ui";
import { categoryName } from "../categories";
import { useCatalogSongs } from "../hooks";

const t = strings.search;

/** The songs of one genre or mood. */
export function BrowseScreen({ tagId }: { tagId: string }) {
  const catalog = useCatalogSongs();
  const items = (catalog.data ?? [])
    .filter((song) => song.tagIds.includes(tagId))
    .map((song) => ({ songId: song.id, song }));
  const name = categoryName(tagId);

  return (
    <View style={styles.root}>
      <TabHeader
        title={t.title}
        right={
          <Text variant="eyebrow" color="textSecondary">
            {t.eyebrow}
          </Text>
        }
      />
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.allCategories}
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text variant="optionHint" color="textSecondary">
            ‹ {t.allCategories}
          </Text>
        </Pressable>
        <Text variant="eyebrow" color="secondary">
          {t.browsing(name)}
        </Text>
      </View>
      {catalog.isError ? (
        <ErrorState onRetry={() => void catalog.refetch()} />
      ) : !catalog.data ? (
        <ListSkeleton />
      ) : (
        <SongList
          items={items}
          source="search"
          queueId={`list:browse:${tagId}`}
          empty={<EmptyState title={t.emptyCategory} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { gap: spacing.md, paddingHorizontal: sizes.pagePadding, marginBottom: spacing.md },
  back: {
    alignSelf: "flex-start",
    minHeight: sizes.headerButton,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
});
