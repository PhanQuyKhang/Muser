import { useState, type ReactElement } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import type { Song } from "@/domain/catalog";
import type { LikeSource } from "@/domain/library";
import { strings } from "@/shared/strings";
import { sizes, spacing } from "@/shared/theme";
import { Button, Sheet, Text } from "@/shared/ui";
import { useLikeToggle, usePlaylistActions } from "../hooks";
import { AddToPlaylistSheet } from "./AddToPlaylistSheet";
import { ConfirmSheet } from "./ConfirmSheet";
import { SongRow } from "./SongRow";

const t = strings.library;

export interface SongListItem {
  songId: string;
  song: Song | null;
}

interface SongListProps {
  items: SongListItem[];
  /** Recorded on a like made from this list. */
  source: LikeSource;
  /** Set on a personal playlist, which adds "Remove from this playlist" to the song menu. */
  playlistId?: string;
  /** Ask before unliking (Liked, where the row disappears). */
  confirmUnlike?: boolean;
  header?: ReactElement;
  empty?: ReactElement;
}

type Open =
  | { kind: "menu"; item: SongListItem }
  | { kind: "add"; item: SongListItem }
  | { kind: "unlike"; item: SongListItem }
  | null;

/** Song rows with their like button and song menu (O05, O03, O08). */
export function SongList({
  items,
  source,
  playlistId,
  confirmUnlike = false,
  header,
  empty,
}: SongListProps) {
  const likes = useLikeToggle();
  const actions = usePlaylistActions();
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  const titleOf = (item: SongListItem) => item.song?.title ?? t.unavailableSong;

  const toggle = (item: SongListItem) => {
    const liked = likes.likedIds.has(item.songId);
    if (liked && confirmUnlike) setOpen({ kind: "unlike", item });
    else likes.toggle({ songId: item.songId, liked, source });
  };

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item.songId}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            {header}
            {likes.failed ? (
              <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
                {strings.common.actionFailed}
              </Text>
            ) : null}
          </View>
        }
        {...(empty ? { ListEmptyComponent: empty } : {})}
        renderItem={({ item }) => (
          <SongRow
            song={item.song}
            songId={item.songId}
            liked={likes.likedIds.has(item.songId)}
            likePending={likes.pendingId === item.songId}
            onToggleLike={() => toggle(item)}
            onMore={() => setOpen({ kind: "menu", item })}
          />
        )}
      />

      {open?.kind === "menu" ? (
        <Sheet title={titleOf(open.item)} onClose={close}>
          {open.item.song ? (
            <Button
              label={t.addToPlaylist}
              variant="secondary"
              onPress={() => setOpen({ kind: "add", item: open.item })}
            />
          ) : null}
          {likes.likedIds.has(open.item.songId) ? (
            <Button
              label={t.unlike}
              variant="secondary"
              onPress={() => setOpen({ kind: "unlike", item: open.item })}
            />
          ) : null}
          {playlistId ? (
            <Button
              label={t.removeFromPlaylist}
              variant="destructive"
              loading={actions.removeSong.isPending}
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
          <Button label={strings.common.cancel} variant="tertiary" onPress={close} />
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
  header: { gap: spacing.md, marginBottom: spacing.xs },
});
