import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { SongList, playFrom } from "@/features/library/components/SongList";
import { strings } from "@/shared/strings";
import { colors, radii, spacing } from "@/shared/theme";
import { Button, DetailHeader, EmptyState, ErrorState, ListSkeleton, Text } from "@/shared/ui";
import { toneFor } from "@/shared/ui/CoverArt";
import { artistsOf, useCatalogSongs } from "../hooks";

const t = strings.search;

/** One artist's songs in this catalog, reached from Search. */
export function ArtistScreen({ artistId }: { artistId: string }) {
  const catalog = useCatalogSongs();
  const songs = (catalog.data ?? []).filter((song) => song.artistIds.includes(artistId));
  const artist = artistsOf(songs).find((item) => item.id === artistId);
  const items = songs.map((song) => ({ songId: song.id, song }));
  const queueId = `list:artist:${artistId}`;

  return (
    <View style={styles.root}>
      <DetailHeader title={t.artistHeader} eyebrow onBack={() => router.back()} />
      {catalog.isError ? (
        <ErrorState onRetry={() => void catalog.refetch()} />
      ) : !catalog.data ? (
        <ListSkeleton />
      ) : !artist ? (
        <EmptyState title={t.artistGone} />
      ) : (
        <SongList
          items={items}
          source="search"
          queueId={queueId}
          header={
            <View style={styles.header}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.hero, { backgroundColor: toneFor(artistId) }]}
              >
                <Text variant="artLetter">{artist.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text variant="titleLarge">{artist.name}</Text>
              <Text variant="optionHint" color="textSecondary">
                {t.artistHint(artist.name)}
              </Text>
              <Button
                label={t.playSongs}
                onPress={() => playFrom(queueId, items, items[0]!.songId)}
              />
              <Text variant="sectionTitle" style={styles.section}>
                {t.inCatalog}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { gap: spacing.md },
  hero: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.row + 2,
  },
  section: { marginTop: spacing.md },
});
