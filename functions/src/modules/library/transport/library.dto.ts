import { toSongDto, type SongDto } from "../../catalog/transport/catalog.dto";
import type { LikeEntry, PlaylistItemEntry } from "../application/library.service";
import type { LikeSource, Playlist } from "../domain/library";

// External API shapes. Timestamps are ISO 8601 strings, never Firestore Timestamps.

export interface LikeDto {
  songId: string;
  likedAt: string;
  source: LikeSource;
  /** null when the song is no longer available (the like is kept). */
  song: SongDto | null;
}

export interface PlaylistDto {
  id: string;
  name: string;
  coverPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItemDto {
  songId: string;
  addedAt: string;
  song: SongDto | null;
}

export const toLikeDto = ({ like, song }: LikeEntry): LikeDto => ({
  songId: like.songId,
  likedAt: like.likedAt.toISOString(),
  source: like.source,
  song: song ? toSongDto(song) : null,
});

export const toPlaylistDto = (p: Playlist): PlaylistDto => ({
  id: p.id,
  name: p.name,
  coverPath: p.coverPath,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

export const toPlaylistItemDto = ({ item, song }: PlaylistItemEntry): PlaylistItemDto => ({
  songId: item.songId,
  addedAt: item.addedAt.toISOString(),
  song: song ? toSongDto(song) : null,
});
