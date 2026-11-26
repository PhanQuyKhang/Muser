import type { Artist, Song } from "../../catalog/domain/catalog";
import type { DiscoveryLevel } from "../../identity/domain/identity";
import { AppError } from "../../../shared/errors";
import { recommend, type Taste } from "../domain/recommend";

export interface TasteProfile extends Taste {
  discoveryLevel: DiscoveryLevel;
}

export interface RecommendationDeps {
  tastes: {
    getTaste(uid: string): Promise<TasteProfile>;
    saveLevel(uid: string, level: DiscoveryLevel): Promise<void>;
  };
  catalog: { listActive(): Promise<{ songs: Song[]; artists: Artist[] }> };
}

export interface Recommendations {
  level: DiscoveryLevel;
  songs: Song[];
  nextCursor: string | null;
}

const encodeCursor = (offset: number) => Buffer.from(String(offset)).toString("base64url");

function decodeCursor(raw: string): number {
  const offset = Number(Buffer.from(raw, "base64url").toString("utf8"));
  if (Number.isSafeInteger(offset) && offset >= 0) return offset;
  throw new AppError("VALIDATION_ERROR", "Invalid cursor");
}

export class RecommendationService {
  constructor(private readonly d: RecommendationDeps) {}

  /** Passing a level applies it and remembers it (O01 Apply). */
  async recommend(
    uid: string,
    input: { level?: DiscoveryLevel; limit: number; cursor?: string },
  ): Promise<Recommendations> {
    const offset = input.cursor ? decodeCursor(input.cursor) : 0;
    const [taste, { songs, artists }] = await Promise.all([
      this.d.tastes.getTaste(uid),
      this.d.catalog.listActive(),
    ]);
    const level = input.level ?? taste.discoveryLevel;
    if (level !== taste.discoveryLevel) await this.d.tastes.saveLevel(uid, level);

    const ranked = recommend(level, taste, songs, artists);
    const end = offset + input.limit;
    return {
      level,
      songs: ranked.slice(offset, end),
      nextCursor: end < ranked.length ? encodeCursor(end) : null,
    };
  }
}
