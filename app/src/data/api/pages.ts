import type { ApiClient } from "./client";

interface PageResponse<T> {
  items: T[];
  nextCursor?: string | null;
}

/** Upper bound on pages per list, so a server bug can never loop forever. */
const MAX_PAGES = 40;

/** Follows the cursor to the end. The MVP catalog is 50-100 tracks, so lists stay small. */
export async function fetchAllPages<T>(api: ApiClient, path: string): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
    const response: PageResponse<T> = await api.get<PageResponse<T>>(`${path}?limit=50${params}`);
    items.push(...response.items);
    cursor = response.nextCursor ?? null;
    if (!cursor) break;
  }
  return items;
}
