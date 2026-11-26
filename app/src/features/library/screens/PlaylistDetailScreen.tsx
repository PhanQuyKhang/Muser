import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Button, EmptyState, ErrorState, Header, ListSkeleton } from "@/shared/ui";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { EntryList } from "../components/EntryList";
import { PlaylistNameSheet } from "../components/PlaylistNameSheet";
import { usePlaylistActions, usePlaylists, usePlaylistSongs } from "../hooks";

const t = strings.library;

/** S14: one personal playlist, with rename (O06) and delete (O07). */
export function PlaylistDetailScreen({ playlistId }: { playlistId: string }) {
  const playlists = usePlaylists();
  const songs = usePlaylistSongs(playlistId);
  const actions = usePlaylistActions();
  const [sheet, setSheet] = useState<"rename" | "delete" | null>(null);
  const playlist = playlists.data?.find((item) => item.id === playlistId);
  const goBack = () => router.back();

  if (playlists.data && !playlist) {
    return (
      <View style={styles.root}>
        <Header title={t.title} onBack={goBack} />
        <EmptyState title={t.playlistGone} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header
        title={playlist?.name ?? t.title}
        {...(songs.data ? { subtitle: t.songCount(songs.data.length) } : {})}
        onBack={goBack}
      />
      {playlist ? (
        <View style={styles.actions}>
          <Button
            label={t.rename}
            variant="secondary"
            size="sm"
            fullWidth={false}
            onPress={() => {
              actions.rename.reset();
              setSheet("rename");
            }}
          />
          <Button
            label={t.deletePlaylist}
            variant="destructive"
            size="sm"
            fullWidth={false}
            onPress={() => {
              actions.remove.reset();
              setSheet("delete");
            }}
          />
        </View>
      ) : null}
      {songs.isError || playlists.isError ? (
        <ErrorState
          onRetry={() => {
            void playlists.refetch();
            void songs.refetch();
          }}
        />
      ) : !songs.data ? (
        <ListSkeleton />
      ) : (
        <EntryList
          entries={songs.data}
          playlistId={playlistId}
          emptyTitle={t.playlistEmpty}
          emptyMessage={t.playlistEmptyHint}
        />
      )}

      {sheet === "rename" && playlist ? (
        <PlaylistNameSheet
          title={t.renameTitle}
          submitLabel={strings.common.save}
          initialName={playlist.name}
          submitting={actions.rename.isPending}
          failed={actions.rename.isError}
          onClose={() => setSheet(null)}
          onSubmit={(name) =>
            actions.rename.mutate({ playlistId, name }, { onSuccess: () => setSheet(null) })
          }
        />
      ) : null}
      {sheet === "delete" ? (
        <ConfirmSheet
          title={t.deleteTitle}
          message={t.deleteMessage}
          confirmLabel={t.deletePlaylist}
          busy={actions.remove.isPending}
          failed={actions.remove.isError}
          onClose={() => setSheet(null)}
          onConfirm={() => actions.remove.mutate(playlistId, { onSuccess: goBack })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: sizes.pagePadding,
    marginBottom: spacing.md,
  },
});
