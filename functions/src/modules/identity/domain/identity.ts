export type DiscoveryLevel = "familiar" | "explore" | "surprise";

// Not specified in the product docs; the design shows "Explore" as the example current mode.
export const DEFAULT_DISCOVERY_LEVEL: DiscoveryLevel = "explore";

export interface Profile {
  username: string;
  displayName: string;
  avatarPath: string | null;
}
