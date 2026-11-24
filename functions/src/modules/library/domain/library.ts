// Domain models for Liked and custom playlists (MUSER_DATABASE.md §5). No Firebase types.

export const LIKE_SOURCES = ["my_explore", "friends", "search", "playlist"] as const;
export type LikeSource = (typeof LIKE_SOURCES)[number];

/** users/{uid}/likes/{songId}: document existence means the song is liked. */
export interface Like {
  songId: string;
  likedAt: Date;
  source: LikeSource;
  sourceShareId: string | null; // only for likes made from a friend's share
  activeShareId: string | null; // set by the Sharing module; always null until it exists
}

export type PlaylistStatus = "active" | "deleting";

export interface Playlist {
  id: string;
  ownerId: string;
  name: string;
  coverPath: string | null;
  status: PlaylistStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** playlists/{playlistId}/items/{songId}: one membership per song, independent of Liked. */
export interface PlaylistItem {
  songId: string;
  addedAt: Date;
  position: number; // sort key; defaults to the add time so manual ordering can come later
}
