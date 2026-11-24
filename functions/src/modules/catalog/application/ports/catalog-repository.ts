import type { Artist, Song, Tag } from "../../domain/catalog";

/** Position in the (normalizedTitle, id) ordering; the id is the deterministic tie-breaker. */
export interface SongCursor {
  sortKey: string;
  id: string;
}

export interface SongQuery {
  limit: number;
  after?: SongCursor;
  tagId?: string;
  artistId?: string;
}

export interface SongPage {
  items: Song[];
  next: SongCursor | null;
}

// Persistence port. Implementations return ACTIVE items only.
export interface CatalogRepository {
  listTags(): Promise<Tag[]>;
  listSongs(query: SongQuery): Promise<SongPage>;
  getSong(id: string): Promise<Song | null>;
  getArtist(id: string): Promise<Artist | null>;
  /** Whole active catalog, for in-memory search (fine for a 50-100 track catalog). */
  listActiveForSearch(): Promise<{ songs: Song[]; artists: Artist[] }>;
}
