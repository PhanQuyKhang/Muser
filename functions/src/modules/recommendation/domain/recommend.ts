// Tag-based ranking for My Explore (MUSER_DATABASE.md §9). Pure and deterministic.
import type { Artist, Song } from "../../catalog/domain/catalog";
import type { DiscoveryLevel } from "../../identity/domain/identity";

export const ALGORITHM_VERSION = "tags-v1";

export interface Taste {
  seedTagIds: string[];
  seedSongIds: string[];
  seedArtistIds: string[];
  likedSongIds: string[];
}

const SEED_TAG_WEIGHT = 3;
const SEED_SONG_WEIGHT = 2;
const SEED_ARTIST_WEIGHT = 2;
const LIKE_WEIGHT = 1;

/** How strongly the listener leans towards each tag. */
export function tagWeights(taste: Taste, songs: Song[], artists: Artist[]): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (tagIds: string[], weight: number) => {
    for (const tag of tagIds) weights.set(tag, (weights.get(tag) ?? 0) + weight);
  };
  const songById = new Map(songs.map((s) => [s.id, s]));
  const artistById = new Map(artists.map((a) => [a.id, a]));

  add(taste.seedTagIds, SEED_TAG_WEIGHT);
  for (const id of taste.seedSongIds) add(songById.get(id)?.tagIds ?? [], SEED_SONG_WEIGHT);
  for (const id of taste.seedArtistIds) add(artistById.get(id)?.tagIds ?? [], SEED_ARTIST_WEIGHT);
  for (const id of taste.likedSongIds) add(songById.get(id)?.tagIds ?? [], LIKE_WEIGHT);
  return weights;
}

/** 0 (nothing familiar) to 1 (as familiar as the best match in the catalog). */
function familiarity(song: Song, weights: Map<string, number>, best: number): number {
  return best > 0 ? score(song, weights) / best : 0;
}

const score = (song: Song, weights: Map<string, number>) =>
  song.tagIds.reduce((sum, tag) => sum + (weights.get(tag) ?? 0), 0);

/** Distance from the familiarity each mode aims for: lower ranks earlier. */
const TARGET: Record<DiscoveryLevel, number> = { familiar: 1, explore: 0.5, surprise: 0 };

/** Ranks songs the listener has not liked yet. */
export function recommend(
  level: DiscoveryLevel,
  taste: Taste,
  songs: Song[],
  artists: Artist[],
): Song[] {
  const weights = tagWeights(taste, songs, artists);
  const best = Math.max(0, ...songs.map((s) => score(s, weights)));
  const liked = new Set(taste.likedSongIds);
  const distance = (s: Song) => Math.abs(familiarity(s, weights, best) - TARGET[level]);

  return songs
    .filter((s) => !liked.has(s.id))
    .map((song) => ({ song, distance: distance(song) }))
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        (b.song.popularityRank ?? 0) - (a.song.popularityRank ?? 0) ||
        a.song.id.localeCompare(b.song.id),
    )
    .map((entry) => entry.song);
}
