import type { Artist, CatalogRepository, Page, PageRequest, Song, Tag } from "@/domain/catalog";
import type { ApiClient } from "./client";

// The API DTOs match the domain shapes today, so they are used directly. If the contract diverges,
// map here rather than leaking DTOs into the UI.
interface ItemsResponse<T> {
  items: T[];
  nextCursor?: string | null;
}

function pageQuery({ limit, cursor }: PageRequest = {}): string {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export class ApiCatalogRepository implements CatalogRepository {
  constructor(private readonly api: ApiClient) {}

  async listTags(): Promise<Tag[]> {
    const { items } = await this.api.get<ItemsResponse<Tag>>("/catalog/tags");
    return items;
  }

  async listSongs(request?: PageRequest): Promise<Page<Song>> {
    const response = await this.api.get<ItemsResponse<Song>>(`/catalog/songs${pageQuery(request)}`);
    return { items: response.items, nextCursor: response.nextCursor ?? null };
  }

  async listArtists(request?: PageRequest): Promise<Page<Artist>> {
    const response = await this.api.get<ItemsResponse<Artist>>(
      `/catalog/artists${pageQuery(request)}`,
    );
    return { items: response.items, nextCursor: response.nextCursor ?? null };
  }

  search(query: string): Promise<{ songs: Song[]; artists: Artist[] }> {
    return this.api.get(`/search?q=${encodeURIComponent(query)}`);
  }
}
