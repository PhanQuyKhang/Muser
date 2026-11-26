import { useState, type ReactElement } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { usePlayerStore } from "@/application/player";
import type { Song } from "@/domain/catalog";
import type { LikeSource } from "@/domain/library";
import { strings } from "@/shared/strings";
import { sizes, spacing } from "@/shared/theme";
import { Sheet, SheetOption, Text } from "@/shared/ui";
import { useLikeToggle, usePlaylistActions } from "../hooks";
import { AddToPlaylistSheet } from "./AddToPlaylistSheet";
import { ConfirmSheet } from "./ConfirmSheet";
import { TrackRow } from "./TrackRow";

const t = strings.library;

export interface SongListItem {
  songId: string;
  song: Song | null;
}

/** Starts playing a list from one of its songs; the rest follow in the order shown. */
export function playFrom(queueId: string, items: SongListItem[], songId: string): void {
  const songs = items.flatMap((item) => (item.song ? [item.song] : []));
  usePlayerStore.getState().play({ id: queueId, songs, autoAdvance: true }, songId);
}

interface SongListProps {
  items: SongListItem[];
  /** Recorded on a like made from this list. */
  source: LikeSource;
  /** Names the playback queue, for example "list:liked". */
  queueId: string;
  /** Set on a personal playlist, which adds "Remove from this playlist" to the song menu. */
  playlistId?: string;
  /** Ask before unliking (Liked, where the row disappears). */
  confirmUnlike?: boolean;
  onPlay?: () => void;
  header?: ReactElement;
  empty?: ReactElement;
  footer?: ReactElement;
}

type Open =
  | { kind: "menu"; item: SongListItem }
  | { kind: "add"; item: SongListItem }
  | { kind: "unlike"; item: SongListItem }
  | null;

/** Song rows with their song menu (O05, O03, O08). */
export function SongList({
  items,
  source,
  queueId,
  playlistId,
  confirmUnlike = false,
  onPlay,
  header,
  empty,
  footer,
}: SongListProps) {
  const likes = useLikeToggle();
  const actions = usePlaylistActions();
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  const titleOf = (item: SongListItem) => item.song?.title ?? t.unavailableSong;

  const toggle = (item: SongListItem) => {
    const liked = likes.likedIds.has(item.songId);
    if (liked && confirmUnlike) {
      setOpen({ kind: "unlike", item });
      return;
    }
    likes.toggle({ songId: item.songId, liked, source });
    close();
  };

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item.songId}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {header}
            {likes.failed ? (
              <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
                {strings.common.actionFailed}
              </Text>
            ) : null}
          </View>
        }
        {...(empty ? { ListEmptyComponent: empty } : {})}
        {...(footer ? { ListFooterComponent: footer } : {})}
        renderItem={({ item }) => (
          <TrackRow
            song={item.song}
            songId={item.songId}
            onPlay={() => {
              playFrom(queueId, items, item.songId);
              onPlay?.();
            }}
            onMore={() => setOpen({ kind: "menu", item })}
          />
        )}
      />

      {open?.kind === "menu" ? (
        <Sheet
          title={titleOf(open.item)}
          {...(open.item.song ? { message: open.item.song.artistNames.join(", ") } : {})}
          onClose={close}
        >
          {open.item.song ? (
            <SheetOption
              label={t.addToPlaylist}
              onPress={() => setOpen({ kind: "add", item: open.item })}
            />
          ) : null}
          {likes.likedIds.has(open.item.songId) ? (
            <SheetOption label={t.unlike} destructive onPress={() => toggle(open.item)} />
          ) : open.item.song ? (
            <SheetOption label={t.like} onPress={() => toggle(open.item)} />
          ) : null}
          {playlistId ? (
            <SheetOption
              label={t.removeFromPlaylist}
              destructive
              disabled={actions.removeSong.isPending}
              onPress={() =>
                actions.removeSong.mutate(
                  { playlistId, songId: open.item.songId },
                  { onSuccess: close },
                )
              }
            />
          ) : null}
          {actions.removeSong.isError ? (
            <Text variant="bodySmall" color="error">
              {strings.common.actionFailed}
            </Text>
          ) : null}
        </Sheet>
      ) : null}

      {open?.kind === "add" ? (
        <AddToPlaylistSheet
          songId={open.item.songId}
          songTitle={titleOf(open.item)}
          onClose={close}
        />
      ) : null}

      {open?.kind === "unlike" ? (
        <ConfirmSheet
          title={t.unlikeTitle}
          message={t.unlikeMessage}
          confirmLabel={t.unlike}
          keepLabel={t.keepSong}
          busy={false}
          failed={false}
          onConfirm={() => {
            likes.toggle({ songId: open.item.songId, liked: true, source });
            close();
          }}
          onClose={close}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.sm },
});
