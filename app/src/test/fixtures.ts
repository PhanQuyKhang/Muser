import type { Artist, Song, Tag } from "@/domain/catalog";

export const makeTag = (id: string, label: string, category: Tag["category"]): Tag => ({
  id,
  label,
  category,
});

export const makeSong = (
  id: string,
  title: string,
  artist: string,
  rank: number | null = 1,
): Song => ({
  id,
  title,
  artistIds: [`artist_${artist}`],
  artistNames: [artist],
  albumId: null,
  coverPath: null,
  durationMs: 200000,
  peakStartMs: 60000,
  tagIds: [],
  explicit: false,
  popularityRank: rank,
});

export const makeArtist = (id: string, name: string): Artist => ({
  id,
  name,
  imagePath: null,
  tagIds: [],
});

export const testUser = { uid: "u1", email: "a@b.co" };
