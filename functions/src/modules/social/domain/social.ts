// Domain models and rules for friendships, shares and hearts (MUSER_DATABASE.md §6-8).
// No Firebase types and no HTTP concerns.
import { createHash } from "node:crypto";

export type FriendshipStatus = "pending" | "accepted" | "declined" | "cancelled" | "removed";

/** friendships/{pairId}: one document per unordered pair of users. */
export interface Friendship {
  id: string;
  memberIds: [string, string];
  requesterId: string;
  recipientId: string;
  status: FriendshipStatus;
  requestedAt: Date;
  respondedAt: Date | null;
  updatedAt: Date;
}

/** The owner's private sharing state (users/{uid}). */
export interface SharingSettings {
  sharingEnabled: boolean;
  /** Privacy generation: bumped on every true -> false transition. */
  shareEpoch: number;
}

/** shares/{shareId}: created together with a new like while sharing is enabled. */
export interface Share {
  id: string;
  ownerId: string;
  songId: string;
  sharedAt: Date;
  epoch: number;
  active: boolean;
}

/** reactions/{reactionId}, mirrored into the recipient's Activity under the same id. */
export interface Heart {
  id: string;
  shareId: string;
  songId: string;
  senderId: string;
  recipientId: string;
  requestId: string;
  createdAt: Date;
}

export const NOT_SHARING: SharingSettings = { sharingEnabled: false, shareEpoch: 0 };

const digest = (parts: string[]) =>
  createHash("sha256").update(JSON.stringify(parts)).digest("base64url");

/** Collision-safe and order independent. */
export const pairId = (a: string, b: string) => digest([a, b].sort());

/** One heart per (share, sender), so a repeat cannot create a second one. */
export const heartId = (shareId: string, senderId: string) => digest([shareId, senderId]);

/** Whether the share may still be shown to an accepted friend. */
export function isShareVisible(share: Share, owner: SharingSettings): boolean {
  return share.active && owner.sharingEnabled && share.epoch === owner.shareEpoch;
}

/** Turning sharing off starts a new privacy generation, so old shares never come back. */
export function changeSharing(current: SharingSettings, enabled: boolean): SharingSettings {
  const turningOff = current.sharingEnabled && !enabled;
  return { sharingEnabled: enabled, shareEpoch: current.shareEpoch + (turningOff ? 1 : 0) };
}
