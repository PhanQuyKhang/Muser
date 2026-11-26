import { useQueries } from "@tanstack/react-query";
import { useState } from "react";

import { useServices } from "@/application/services";
import { strings } from "@/shared/strings";
import { Button, EmptyState, ErrorState, Sheet, Skeleton, Text } from "@/shared/ui";
import { libraryKeys, usePlaylistActions, usePlaylists } from "../hooks";
import { PlaylistNameSheet } from "./PlaylistNameSheet";

const t = strings.library;

interface AddToPlaylistSheetProps {
  songId: string;
  songTitle: string;
  onClose: () => void;
}

/** O03: add a song to a personal playlist, or create one first. Never likes or shares the song. */
export function AddToPlaylistSheet({ songId, songTitle, onClose }: AddToPlaylistSheetProps) {
  const { library } = useServices();
  const playlists = usePlaylists();
  const actions = usePlaylistActions();
  const [creating, setCreating] = useState(false);

  // Membership of each playlist, to show "Already added".
  const members = useQueries({
    queries: (playlists.data ?? []).map((playlist) => ({
      queryKey: libraryKeys.playlistSongs(playlist.id),
      queryFn: () => library.listPlaylistSongs(playlist.id),
    })),
  });

  if (creating) {
    return (
      <PlaylistNameSheet
        title={t.createTitle}
        submitLabel={t.createAndAdd}
        submitting={actions.create.isPending || actions.addSong.isPending}
        failed={actions.create.isError || actions.addSong.isError}
        onClose={() => setCreating(false)}
        onSubmit={async (name) => {
          try {
            const playlist = await actions.create.mutateAsync(name);
            await actions.addSong.mutateAsync({ playlistId: playlist.id, songId });
            onClose();
          } catch {
            // The mutation state shows the error; the sheet stays open for a retry.
          }
        }}
      />
    );
  }

  return (
    <Sheet title={t.addToPlaylist} message={songTitle} onClose={onClose}>
      {playlists.isError ? (
        <ErrorState onRetry={() => void playlists.refetch()} />
      ) : playlists.isLoading ? (
        <Skeleton height={50} />
      ) : playlists.data?.length === 0 ? (
        <EmptyState title={t.noPlaylists} />
      ) : (
        playlists.data?.map((playlist, index) => {
          const added = members[index]?.data?.some((entry) => entry.songId === songId) ?? false;
          return (
            <Button
              key={playlist.id}
              label={added ? t.alreadyAdded(playlist.name) : playlist.name}
              variant="secondary"
              disabled={added || actions.addSong.isPending}
              onPress={() => actions.addSong.mutate({ playlistId: playlist.id, songId })}
            />
          );
        })
      )}
      {actions.addSong.isError ? (
        <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
          {strings.common.actionFailed}
        </Text>
      ) : null}
      <Button label={t.createPlaylist} onPress={() => setCreating(true)} />
      <Button label={strings.common.done} variant="tertiary" onPress={onClose} />
    </Sheet>
  );
}
