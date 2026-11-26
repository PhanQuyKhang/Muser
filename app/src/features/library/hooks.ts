import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useServices } from "@/application/services";
import type { LikeSource } from "@/domain/library";

export const libraryKeys = {
  all: ["library"] as const,
  likes: ["library", "likes"] as const,
  playlists: ["library", "playlists"] as const,
  playlistSongs: (playlistId: string) => ["library", "playlist", playlistId] as const,
};

export function useLikes() {
  const { library } = useServices();
  return useQuery({ queryKey: libraryKeys.likes, queryFn: () => library.listLikes() });
}

export function usePlaylists() {
  const { library } = useServices();
  return useQuery({ queryKey: libraryKeys.playlists, queryFn: () => library.listPlaylists() });
}

export function usePlaylistSongs(playlistId: string) {
  const { library } = useServices();
  return useQuery({
    queryKey: libraryKeys.playlistSongs(playlistId),
    queryFn: () => library.listPlaylistSongs(playlistId),
  });
}

interface ToggleLike {
  songId: string;
  liked: boolean;
  source: LikeSource;
  sourceShareId?: string;
}

/** Liked membership plus a like/unlike action, shared by every screen that shows a heart. */
export function useLikeToggle() {
  const { library } = useServices();
  const queryClient = useQueryClient();
  const likes = useLikes();
  const likedIds = useMemo(
    () => new Set((likes.data ?? []).map((entry) => entry.songId)),
    [likes.data],
  );

  const mutation = useMutation({
    mutationFn: ({ songId, liked, source, sourceShareId }: ToggleLike) =>
      liked ? library.unlike(songId) : library.like(songId, source, sourceShareId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: libraryKeys.likes }),
  });

  return {
    likedIds,
    toggle: mutation.mutate,
    pendingId: mutation.isPending ? mutation.variables.songId : null,
    failed: mutation.isError,
    retry: () => {
      if (mutation.variables) mutation.mutate(mutation.variables);
    },
  };
}

export function usePlaylistActions() {
  const { library } = useServices();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: libraryKeys.all });

  return {
    create: useMutation({
      mutationFn: (name: string) => library.createPlaylist(name),
      onSuccess: refresh,
    }),
    rename: useMutation({
      mutationFn: (input: { playlistId: string; name: string }) =>
        library.renamePlaylist(input.playlistId, input.name),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (playlistId: string) => library.deletePlaylist(playlistId),
      // The deleted playlist's songs must not be refetched (the API now answers 404).
      onSuccess: (_result, playlistId) => {
        queryClient.removeQueries({ queryKey: libraryKeys.playlistSongs(playlistId) });
        return queryClient.invalidateQueries({ queryKey: libraryKeys.playlists });
      },
    }),
    addSong: useMutation({
      mutationFn: (input: { playlistId: string; songId: string }) =>
        library.addToPlaylist(input.playlistId, input.songId),
      onSuccess: refresh,
    }),
    removeSong: useMutation({
      mutationFn: (input: { playlistId: string; songId: string }) =>
        library.removeFromPlaylist(input.playlistId, input.songId),
      onSuccess: refresh,
    }),
  };
}
