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

export interface ArtistQuery {
  limit: number;
  after?: SongCursor; // same (sortKey, id) shape; the sort key is normalizedName
  tagId?: string;
}

export interface ArtistPage {
  items: Artist[];
  next: SongCursor | null;
}

// Persistence port. Implementations return ACTIVE items only.
export interface CatalogRepository {
  listTags(): Promise<Tag[]>;
  listSongs(query: SongQuery): Promise<SongPage>;
  getSong(id: string): Promise<Song | null>;
  /** Active songs among these ids (batched read); unknown or inactive ids are omitted. */
  getSongs(ids: string[]): Promise<Song[]>;
  getArtist(id: string): Promise<Artist | null>;
  /** Active artists ordered by (normalizedName, id), optionally only those with a tag. */
  listArtists(query: ArtistQuery): Promise<ArtistPage>;
  /** Which of these ids exist AND are active in the given collection. */
  findActiveIds(collection: "tags" | "songs" | "artists", ids: string[]): Promise<Set<string>>;
  /** Whole active catalog, for in-memory search (fine for a 50-100 track catalog). */
  listActiveForSearch(): Promise<{ songs: Song[]; artists: Artist[] }>;
}
