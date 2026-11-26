import type { Song } from "./catalog";

export interface PublicProfile {
  uid: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
}

export type Relationship = "none" | "friends" | "incoming" | "outgoing" | "self";

export interface FoundUser {
  profile: PublicProfile;
  relationship: Relationship;
  pairId: string;
}

export interface FriendEntry {
  pairId: string;
  profile: PublicProfile;
}

export interface FriendRequests {
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
}

export type RequestAction = "accept" | "decline" | "cancel";

export interface Sharer extends PublicProfile {
  shareId: string;
  sharedAt: string;
  heartSent: boolean;
}

/** One song on My Friends, with every friend who shared it (newest first). */
export interface Discovery {
  song: Song;
  sharers: Sharer[];
}

export interface ActivityItem {
  id: string;
  createdAt: string;
  actor: PublicProfile | null;
  /** null once the shared song is no longer available. */
  song: Song | null;
}

export interface SocialRepository {
  findUser(username: string): Promise<FoundUser | null>;
  listFriends(): Promise<FriendEntry[]>;
  listRequests(): Promise<FriendRequests>;
  sendRequest(username: string): Promise<void>;
  respond(pairId: string, action: RequestAction): Promise<void>;
  removeFriend(pairId: string): Promise<void>;
  getSharing(): Promise<boolean>;
  setSharing(enabled: boolean): Promise<void>;
  listDiscoveries(): Promise<Discovery[]>;
  /** `requestId` makes a retry of the same tap safe. */
  sendHeart(shareId: string, requestId: string): Promise<void>;
  listActivity(): Promise<ActivityItem[]>;
}
