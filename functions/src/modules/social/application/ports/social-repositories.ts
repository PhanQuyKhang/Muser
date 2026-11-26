import type { Friendship, Heart, Share, SharingSettings } from "../../domain/social";

export interface PublicProfile {
  uid: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
}

// ---- Transaction-bound repositories (used inside UnitOfWork.run) ----

export interface SocialRepositories {
  friendships: {
    get(id: string): Promise<Friendship | null>;
    save(friendship: Friendship): Promise<void>;
  };
  settings: {
    get(uid: string): Promise<SharingSettings>;
    save(uid: string, settings: SharingSettings): Promise<void>;
  };
  shares: {
    get(id: string): Promise<Share | null>;
  };
  hearts: {
    get(id: string): Promise<Heart | null>;
    /** Writes the reaction and the recipient's Activity row together. */
    create(heart: Heart): Promise<void>;
  };
}

// ---- Non-transactional ports ----

export interface SocialQueries {
  /** uid that owns this normalized username, or null. */
  findUidByUsername(username: string): Promise<string | null>;
  /** Profiles that exist, keyed by uid. */
  getProfiles(uids: string[]): Promise<Map<string, PublicProfile>>;
  getSettings(uid: string): Promise<SharingSettings>;
  getFriendship(id: string): Promise<Friendship | null>;
  listAccepted(uid: string, limit: number): Promise<Friendship[]>;
  listIncoming(uid: string, limit: number): Promise<Friendship[]>;
  listOutgoing(uid: string, limit: number): Promise<Friendship[]>;
  /** Active shares of one owner in one privacy generation, newest first. */
  listShares(ownerId: string, epoch: number, limit: number): Promise<Share[]>;
  getShares(ids: string[]): Promise<Map<string, Share>>;
  /** Which of these heart ids already exist. */
  findHearts(ids: string[]): Promise<Set<string>>;
  /** Hearts received, newest first. */
  listActivity(uid: string, limit: number): Promise<Heart[]>;
}
