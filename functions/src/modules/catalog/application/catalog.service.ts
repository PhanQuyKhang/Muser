import { AppError } from "../../../shared/errors";
import type { Clock } from "../../../shared/clock";
import type { Artist, Song, Tag, TagCategory } from "../domain/catalog";
import type { CatalogRepository, SongCursor } from "./ports/catalog-repository";

const SEARCH_CACHE_TTL_MS = 60_000;
const SEARCH_LIMIT = 20;
const ARTIST_SONGS_LIMIT = 50;

export const normalizeText = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function encodeCursor(c: SongCursor): string {
  return Buffer.from(JSON.stringify({ k: c.sortKey, i: c.id })).toString("base64url");
}

export function decodeCursor(raw: string): SongCursor {
  try {
    const o = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof o?.k === "string" && typeof o?.i === "string" && o.k.length <= 300 && o.i.length <= 128) {
      return { sortKey: o.k, id: o.i };
    }
  } catch {
    /* fall through */
  }
  throw new AppError("VALIDATION_ERROR", "Invalid cursor");
}

export interface SongList {
  items: Song[];
  nextCursor: string | null;
}

export class CatalogService {
  private searchCache: { at: number; songs: Song[]; artists: Artist[] } | null = null;

  constructor(
    private readonly repo: CatalogRepository,
    private readonly clock: Clock,
  ) {}

  async listTags(category?: TagCategory): Promise<Tag[]> {
    const tags = await this.repo.listTags();
    return tags
      .filter((t) => !category || t.category === category)
      .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
  }

  async listSongs(input: { limit: number; cursor?: string; tagId?: string; artistId?: string }): Promise<SongList> {
    // Firestore allows a single array-contains per query, so filters are mutually exclusive.
    if (input.tagId && input.artistId) {
      throw new AppError("VALIDATION_ERROR", "Use either tagId or artistId, not both");
    }
    const page = await this.repo.listSongs({
      limit: input.limit,
      after: input.cursor ? decodeCursor(input.cursor) : undefined,
      tagId: input.tagId,
      artistId: input.artistId,
    });
    return { items: page.items, nextCursor: page.next ? encodeCursor(page.next) : null };
  }

  async getSong(id: string): Promise<Song> {
    const song = await this.repo.getSong(id);
    if (!song) throw new AppError("NOT_FOUND", "Song not found");
    return song;
  }

  /** Active songs by id, for hydrating lists in other modules. Missing ids are absent. */
  async getSongsByIds(ids: string[]): Promise<Map<string, Song>> {
    return new Map((await this.repo.getSongs(ids)).map((s) => [s.id, s]));
  }

  async getArtist(id: string): Promise<{ artist: Artist; songs: Song[] }> {
    const artist = await this.repo.getArtist(id);
    if (!artist) throw new AppError("NOT_FOUND", "Artist not found");
    const page = await this.repo.listSongs({ limit: ARTIST_SONGS_LIMIT, artistId: id });
    return { artist, songs: page.items };
  }

  /** References that are missing or not active, e.g. ["tag:genre_xyz"]. Empty means all valid. */
  async findMissingReferences(refs: { tagIds: string[]; songIds: string[]; artistIds: string[] }): Promise<string[]> {
    const [tags, songs, artists] = await Promise.all([
      this.repo.findActiveIds("tags", refs.tagIds),
      this.repo.findActiveIds("songs", refs.songIds),
      this.repo.findActiveIds("artists", refs.artistIds),
    ]);
    return [
      ...refs.tagIds.filter((id) => !tags.has(id)).map((id) => `tag:${id}`),
      ...refs.songIds.filter((id) => !songs.has(id)).map((id) => `song:${id}`),
      ...refs.artistIds.filter((id) => !artists.has(id)).map((id) => `artist:${id}`),
    ];
  }

  /** Substring search over the cached active catalog; prefix matches rank first. */
  async search(query: string): Promise<{ songs: Song[]; artists: Artist[] }> {
    const q = normalizeText(query);
    if (!q) return { songs: [], artists: [] };
    const { songs, artists } = await this.activeCatalog();

    const rank = (hay: string) => (hay.startsWith(q) ? 0 : hay.includes(q) ? 1 : -1);
    const byPopularity = (a: Song, b: Song) => (b.popularityRank ?? 0) - (a.popularityRank ?? 0);

    const matchedSongs = songs
      .map((s) => {
        const ranks = [rank(s.normalizedTitle), ...s.artistNames.map((n) => rank(normalizeText(n)))].filter((r) => r >= 0);
        return { s, r: ranks.length ? Math.min(...ranks) : -1 };
      })
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r || byPopularity(a.s, b.s) || a.s.normalizedTitle.localeCompare(b.s.normalizedTitle))
      .slice(0, SEARCH_LIMIT)
      .map((x) => x.s);

    const matchedArtists = artists
      .map((a) => ({ a, r: rank(a.normalizedName) }))
      .filter((x) => x.r >= 0)
      .sort((x, y) => x.r - y.r || x.a.normalizedName.localeCompare(y.a.normalizedName))
      .slice(0, SEARCH_LIMIT)
      .map((x) => x.a);

    return { songs: matchedSongs, artists: matchedArtists };
  }

  private async activeCatalog() {
    const now = this.clock.now().getTime();
    if (!this.searchCache || now - this.searchCache.at > SEARCH_CACHE_TTL_MS) {
      const { songs, artists } = await this.repo.listActiveForSearch();
      this.searchCache = { at: now, songs, artists };
    }
    return this.searchCache;
  }
}
