import type { Artist, Song, Tag } from "../domain/catalog";

// External API shapes. They deliberately omit storage paths for audio, rights data and
// internal fields; playback URLs come from the Media module.

export interface TagDto {
  id: string;
  label: string;
  category: "genre" | "mood";
}

export interface ArtistDto {
  id: string;
  name: string;
  imagePath: string | null;
  tagIds: string[];
}

export interface SongDto {
  id: string;
  title: string;
  artistIds: string[];
  artistNames: string[];
  albumId: string | null;
  coverPath: string | null;
  durationMs: number;
  peakStartMs: number;
  tagIds: string[];
  explicit: boolean;
  popularityRank: number | null;
}

export const toTagDto = (t: Tag): TagDto => ({ id: t.id, label: t.label, category: t.category });

export const toArtistDto = (a: Artist): ArtistDto => ({
  id: a.id,
  name: a.name,
  imagePath: a.imagePath,
  tagIds: a.tagIds,
});

export const toSongDto = (s: Song): SongDto => ({
  id: s.id,
  title: s.title,
  artistIds: s.artistIds,
  artistNames: s.artistNames,
  albumId: s.albumId,
  coverPath: s.coverPath,
  durationMs: s.durationMs,
  peakStartMs: s.peakStartMs,
  tagIds: s.tagIds,
  explicit: s.explicit,
  popularityRank: s.popularityRank,
});
