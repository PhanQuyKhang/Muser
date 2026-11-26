import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Button, EmptyState, ErrorState, Header, ListRow, ListSkeleton } from "@/shared/ui";
import { PlaylistNameSheet } from "../components/PlaylistNameSheet";
import { useLikes, usePlaylistActions, usePlaylists } from "../hooks";

const t = strings.library;

/** S12: the permanent Liked playlist, personal playlists and Create playlist. */
export function PlaylistsScreen() {
  const likes = useLikes();
  const playlists = usePlaylists();
  const { create } = usePlaylistActions();
  const [creating, setCreating] = useState(false);

  return (
    <View style={styles.root}>
      <Header title={t.title} />
      <ScrollView contentContainerStyle={styles.content}>
        <ListRow
          title={t.liked}
          subtitle={likes.data ? t.songCount(likes.data.length) : t.likedHint}
          coverSeed="liked"
          onPress={() => router.push("/playlist/liked")}
        />
        {playlists.isError ? (
          <ErrorState onRetry={() => void playlists.refetch()} />
        ) : playlists.isLoading ? (
          <ListSkeleton rows={3} />
        ) : playlists.data?.length === 0 ? (
          <EmptyState title={t.noPlaylists} message={t.noPlaylistsHint} />
        ) : (
          playlists.data?.map((playlist) => (
            <ListRow
              key={playlist.id}
              title={playlist.name}
              coverSeed={playlist.id}
              onPress={() =>
                router.push({ pathname: "/playlist/[id]", params: { id: playlist.id } })
              }
            />
          ))
        )}
        <Button
          label={t.createPlaylist}
          onPress={() => {
            create.reset();
            setCreating(true);
          }}
        />
      </ScrollView>
      {creating ? (
        <PlaylistNameSheet
          title={t.createTitle}
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
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.sm },
});
