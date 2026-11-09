import { Timestamp } from 'firebase-admin/firestore';

// =================================================================
// 1. Identity & Profiles (MUSER_DATABASE.md Section 3)
// =================================================================
export interface ProfileDocument {
  username: string;
  displayName: string;
  avatarPath: string | null;
  status: 'active' | 'deleted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UsernameDocument {
  uid: string;
  createdAt: Timestamp;
}

export interface UserSettingsDocument {
  onboardingCompletedAt: Timestamp | null;
  seedTagIds: string[];
  seedSongIds: string[];
  seedArtistIds: string[];
  discoveryLevel: 'familiar' | 'explore' | 'surprise';
  sharingEnabled: boolean;
  shareEpoch: number;
  notificationPreferences: {
    reactionsPush: boolean;
    friendRequestsPush: boolean;
  };
  activityReadThroughAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =================================================================
// 2. Music Catalog (MUSER_DATABASE.md Section 4)
// =================================================================
export interface SongDocument {
  title: string;
  normalizedTitle: string;
  artistIds: string[];
  artistNames: string[];
  albumId: string | null;
  coverPath: string;
  durationMs: number;
  tagIds: string[];
  explicit: boolean;
  status: 'active' | 'unavailable' | 'archived';
  audio: {
    storagePath: string;
    mimeType: string;
    bitrateKbps: number;
  };
  rights: {
    source: string;
    attribution: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =================================================================
// 3. Playlists & Likes (MUSER_DATABASE.md Section 5)
// =================================================================
export interface LikeDocument {
  songId: string;
  likedAt: Timestamp;
  source: 'my_explore' | 'friends' | 'search' | 'playlist';
  sourceShareId: string | null;
  activeShareId: string | null;
}

export interface PlaylistDocument {
  ownerId: string;
  name: string;
  description: string | null;
  coverPath: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlaylistItemDocument {
  songId: string;
  addedAt: Timestamp;
  position: number;
}

// =================================================================
// 4. Friendships (MUSER_DATABASE.md Section 6)
// =================================================================
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'removed';

export interface FriendshipDocument {
  memberIds: [string, string];
  requesterId: string;
  recipientId: string;
  status: FriendshipStatus;
  requestedAt: Timestamp;
  respondedAt: Timestamp | null;
  updatedAt: Timestamp;
}

// =================================================================
// 5. Sharing & Privacy (MUSER_DATABASE.md Section 7)
// =================================================================
export interface ShareDocument {
  ownerId: string;
  songId: string;
  sharedAt: Timestamp;
  epoch: number;
  active: boolean;
  deactivatedAt: Timestamp | null;
  deactivationReason: 'unliked' | 'owner_deleted' | null;
}

// =================================================================
// 6. Reactions & Activity (MUSER_DATABASE.md Section 8)
// =================================================================
export interface ReactionDocument {
  shareId: string;
  songId: string;
  senderId: string;
  recipientId: string;
  type: 'heart';
  createdAt: Timestamp;
}

export interface ActivityDocument {
  type: 'heart_received';
  reactionId: string;
  actorId: string;
  shareId: string;
  songId: string;
  createdAt: Timestamp;
}

// =================================================================
// 7. Backend Use-Case Contracts (MUSER_DATABASE.md Section 11)
// =================================================================
export interface CompleteOnboardingInput {
  username: string;
  displayName: string;
  seedTagIds: string[];
  seedSongIds: string[];
  seedArtistIds: string[];
  sharingEnabled: boolean;
}

export interface SetSharingInput {
  enabled: boolean;
}

export interface LikeSongInput {
  songId: string;
  source: 'my_explore' | 'friends' | 'search' | 'playlist';
  sourceShareId?: string;
}

export interface UnlikeSongInput {
  songId: string;
}

export interface AddPlaylistSongInput {
  playlistId: string;
  songId: string;
}

export interface RemovePlaylistSongInput {
  playlistId: string;
  songId: string;
}

export interface ManageFriendshipInput {
  otherUid: string;
  action: 'request' | 'accept' | 'decline' | 'cancel' | 'remove';
}

export interface GetFriendDiscoveriesInput {
  limit?: number;
  cursor?: string;
}

export interface SendHeartInput {
  shareId: string;
  requestId: string;
}

export interface GetRecommendationsInput {
  level: 'familiar' | 'explore' | 'surprise';
  limit?: number;
  cursor?: string;
}

