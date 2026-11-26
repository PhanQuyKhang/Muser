import { useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useServices } from "@/application/services";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { EmptyState, ErrorState, ListSkeleton, TabHeader, Text } from "@/shared/ui";
import { Collage, LikedCover } from "../components/Covers";
import { PlaylistNameSheet } from "../components/PlaylistNameSheet";
import { libraryKeys, useLikes, usePlaylistActions, usePlaylists } from "../hooks";

const t = strings.library;

/** S12: the permanent Liked playlist, personal playlists and Create playlist. */
export function PlaylistsScreen() {
  const { library } = useServices();
  const likes = useLikes();
  const playlists = usePlaylists();
  const { create } = usePlaylistActions();
  const [creating, setCreating] = useState(false);

  // For each row's song count and collage.
  const songs = useQueries({
    queries: (playlists.data ?? []).map((playlist) => ({
      queryKey: libraryKeys.playlistSongs(playlist.id),
      queryFn: () => library.listPlaylistSongs(playlist.id),
    })),
  });
  const likedCount = likes.data ? t.songCount(likes.data.length) : null;

  return (
    <View style={styles.root}>
      <TabHeader
        title={t.title}
        subtitle={t.subtitle}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.createPlaylist}
            hitSlop={spacing.xs}
            onPress={() => {
              create.reset();
              setCreating(true);
            }}
            style={styles.add}
          >
            <Text variant="titleLarge" color="primary">
              +
            </Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={likedCount ? `${t.liked}, ${likedCount}` : t.liked}
          onPress={() => router.push("/playlist/liked")}
          style={({ pressed }) => [styles.likedCard, pressed && styles.pressed]}
        >
          <LikedCover size={sizes.likedCover} />
          <View style={styles.likedText}>
            <Text variant="eyebrow" color="secondary">
              {t.likedEyebrow}
            </Text>
            <Text variant="headline">{t.liked}</Text>
            {likedCount ? (
              <Text variant="optionHint" color="textSecondary">
                {likedCount}
              </Text>
            ) : null}
            <Text variant="caption" color="textSecondary">
              {t.likedTagline}
            </Text>
          </View>
        </Pressable>

        <View style={styles.heading}>
          <Text variant="sectionTitle">{t.madeByYou}</Text>
          <Text variant="caption" color="textSecondary">
            {t.madeByYouHint}
          </Text>
        </View>

        {playlists.isError ? (
          <ErrorState onRetry={() => void playlists.refetch()} />
        ) : playlists.isLoading ? (
          <ListSkeleton rows={3} />
        ) : playlists.data?.length === 0 ? (
          <EmptyState title={t.noPlaylists} message={t.noPlaylistsHint} />
        ) : (
          playlists.data?.map((playlist, index) => {
            const entries = songs[index]?.data;
            const count = entries ? t.songCount(entries.length) : null;
            return (
              <Pressable
                key={playlist.id}
                accessibilityRole="button"
                accessibilityLabel={count ? `${playlist.name}, ${count}` : playlist.name}
                onPress={() =>
                  router.push({ pathname: "/playlist/[id]", params: { id: playlist.id } })
                }
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Collage entries={entries ?? []} seed={playlist.id} size={sizes.rowCover} />
                <View style={styles.rowText}>
                  <Text variant="songTitle" numberOfLines={1}>
                    {playlist.name}
                  </Text>
                  {count ? (
                    <Text variant="optionHint" color="textSecondary">
                      {count}
                    </Text>
                  ) : null}
                </View>
                <Text variant="chevron" color="textSecondary">
                  ›
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
      {creating ? (
        <PlaylistNameSheet
          title={t.createTitle}
          message={t.createMessage}
          submitLabel={t.create}
          submitting={create.isPending}
          failed={create.isError}
          onClose={() => setCreating(false)}
          onSubmit={(name) =>
            create.mutate(name, {
              onSuccess: (playlist) => {
                setCreating(false);
                router.push({ pathname: "/playlist/[id]", params: { id: playlist.id } });
              },
            })
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  add: {
    width: sizes.headerButton,
    height: sizes.headerButton,
    borderRadius: sizes.headerButton / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
  },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.md },
  likedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl - 4,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  likedText: { flex: 1, gap: spacing.xs },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  row: {
    minHeight: sizes.playlistRow,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radii.row,
  },
  rowText: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.85 },
});
