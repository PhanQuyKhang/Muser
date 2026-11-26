import type { Song } from "@/domain/catalog";
import type { LibraryEntry, SortOrder } from "@/domain/library";

/** Lower-case and strip accents, so "beyonce" finds "Beyoncé". */
export const normalizeText = (text: string) =>
  text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function matchesSong(song: Song, query: string): boolean {
  const needle = normalizeText(query);
  return [song.title, ...song.artistNames].some((text) => normalizeText(text).includes(needle));
}

/** Playlist-local search and the Newest/Oldest added sort (S13, S14, O04). */
export function filterEntries(
  entries: LibraryEntry[],
  query: string,
  sort: SortOrder,
): LibraryEntry[] {
  const found = query.trim()
    ? entries.filter((entry) => entry.song && matchesSong(entry.song, query))
    : entries;
  const direction = sort === "newest" ? -1 : 1;
  return [...found].sort((a, b) => direction * a.addedAt.localeCompare(b.addedAt));
}
