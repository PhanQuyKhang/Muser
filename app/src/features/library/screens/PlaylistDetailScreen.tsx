import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors, sizes } from "@/shared/theme";
import {
  DetailHeader,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Sheet,
  SheetOption,
  Text,
} from "@/shared/ui";
import { Collection } from "../components/Collection";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { Collage } from "../components/Covers";
import { PlaylistNameSheet } from "../components/PlaylistNameSheet";
import { usePlaylistActions, usePlaylists, usePlaylistSongs } from "../hooks";

const t = strings.library;

/** S14: one personal playlist, with rename (O06) and delete (O07). */
export function PlaylistDetailScreen({ playlistId }: { playlistId: string }) {
  const playlists = usePlaylists();
  const songs = usePlaylistSongs(playlistId);
  const actions = usePlaylistActions();
  const [sheet, setSheet] = useState<"manage" | "rename" | "delete" | null>(null);
  const playlist = playlists.data?.find((item) => item.id === playlistId);
  const goBack = () => router.back();

  if (playlists.data && !playlist) {
    return (
      <View style={styles.root}>
        <DetailHeader title={t.playlistHeader} eyebrow onBack={goBack} />
        <EmptyState title={t.playlistGone} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DetailHeader
        title={t.playlistHeader}
        eyebrow
        onBack={goBack}
        right={
          playlist ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.manage}
              onPress={() => setSheet("manage")}
              style={styles.menu}
            >
              <Text variant="subheading" color="textSecondary">
                •••
              </Text>
            </Pressable>
          ) : null
        }
      />
      {songs.isError || playlists.isError ? (
        <ErrorState
          onRetry={() => {
            void playlists.refetch();
            void songs.refetch();
          }}
        />
      ) : !songs.data || !playlist ? (
        <ListSkeleton />
      ) : (
        <Collection
          eyebrow={t.playlistFrom}
          name={playlist.name}
          cover={<Collage entries={songs.data} seed={playlistId} size={sizes.detailCover} />}
          entries={songs.data}
          queueId={`list:${playlistId}`}
          playlistId={playlistId}
          action={{ label: t.addSongs, onPress: () => router.navigate("/search") }}
          emptyTitle={t.playlistEmpty}
          emptyMessage={t.playlistEmptyHint}
        />
      )}

      {sheet === "manage" && playlist ? (
        <Sheet title={playlist.name} onClose={() => setSheet(null)}>
          <SheetOption
            label={t.rename}
            onPress={() => {
              actions.rename.reset();
              setSheet("rename");
            }}
          />
          <SheetOption
            label={t.deletePlaylist}
            destructive
            onPress={() => {
              actions.remove.reset();
              setSheet("delete");
            }}
          />
        </Sheet>
      ) : null}
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
          keepLabel={t.keepPlaylist}
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
  menu: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
