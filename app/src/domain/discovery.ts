import type { Song } from "./catalog";

export type DiscoveryLevel = "familiar" | "explore" | "surprise";

export const DISCOVERY_LEVELS: readonly DiscoveryLevel[] = ["familiar", "explore", "surprise"];

export interface Recommendations {
  level: DiscoveryLevel;
  songs: Song[];
}

export interface DiscoveryRepository {
  /** Without a level the saved one is used; passing one applies and remembers it. */
  recommend(level?: DiscoveryLevel): Promise<Recommendations>;
}
