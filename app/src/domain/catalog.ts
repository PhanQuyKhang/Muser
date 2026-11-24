export type TagCategory = "genre" | "mood";

export interface Tag {
  id: string;
  label: string;
  category: TagCategory;
}

export interface Artist {
  id: string;
  name: string;
  /** Storage path, not a URL. Null means no portrait. */
  imagePath: string | null;
  tagIds: string[];
}

export interface Song {
  id: string;
  title: string;
  artistIds: string[];
  artistNames: string[];
  albumId: string | null;
  /** Storage path, not a URL. Null means no cover. */
  coverPath: string | null;
  durationMs: number;
  peakStartMs: number;
  tagIds: string[];
  explicit: boolean;
  popularityRank: number | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageRequest {
  limit?: number;
  cursor?: string | undefined;
}

export interface CatalogRepository {
  listTags(): Promise<Tag[]>;
  listSongs(request?: PageRequest): Promise<Page<Song>>;
  listArtists(request?: PageRequest): Promise<Page<Artist>>;
  search(query: string): Promise<{ songs: Song[]; artists: Artist[] }>;
}
