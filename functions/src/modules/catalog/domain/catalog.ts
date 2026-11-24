// Domain models for the catalog. Only ACTIVE items are ever loaded into these types;
// unavailable/archived items are invisible to every caller. No Firebase types here.

export type TagCategory = "genre" | "mood";

export interface Tag {
  id: string;
  label: string;
  category: TagCategory;
}

export interface Artist {
  id: string;
  name: string;
  normalizedName: string;
  imagePath: string | null;
  tagIds: string[];
}

export interface Song {
  id: string;
  title: string;
  normalizedTitle: string;
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

// NOTE: audio.storagePath and rights are deliberately NOT part of this model. Playback
// goes through the Media module, which checks availability and issues a URL.
