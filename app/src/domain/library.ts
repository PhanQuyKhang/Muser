import type { Song } from "./catalog";

export type LikeSource = "my_explore" | "friends" | "search" | "playlist";
export type SortOrder = "newest" | "oldest";

/** A song saved in Liked or in a playlist. `song` is null once the catalog withdraws it. */
export interface LibraryEntry {
  songId: string;
  addedAt: string;
  song: Song | null;
}

export interface Playlist {
  id: string;
  name: string;
  coverPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PLAYLIST_NAME_MAX = 60;

export interface LibraryRepository {
  /** Every liked song, newest first. */
  listLikes(): Promise<LibraryEntry[]>;
  like(songId: string, source: LikeSource, sourceShareId?: string): Promise<void>;
  unlike(songId: string): Promise<void>;
  /** The caller's playlists, most recently updated first. */
  listPlaylists(): Promise<Playlist[]>;
  createPlaylist(name: string): Promise<Playlist>;
  renamePlaylist(playlistId: string, name: string): Promise<void>;
  deletePlaylist(playlistId: string): Promise<void>;
  /** Songs of one playlist, newest added first. */
  listPlaylistSongs(playlistId: string): Promise<LibraryEntry[]>;
  addToPlaylist(playlistId: string, songId: string): Promise<void>;
  removeFromPlaylist(playlistId: string, songId: string): Promise<void>;
}
