import type { DiscoveryLevel, Profile } from "../../domain/identity";

export interface OnboardedSettings {
  seedTagIds: string[];
  seedSongIds: string[];
  seedArtistIds: string[];
  discoveryLevel: DiscoveryLevel;
  sharingEnabled: boolean;
}

// ---- Transaction-bound repositories (used inside UnitOfWork.run) ----

export interface UserSettingsRepository {
  get(uid: string): Promise<{ onboardingCompleted: boolean } | null>;
  /** Writes users/{uid} with shareEpoch 0 and a trusted server onboardingCompletedAt. */
  saveOnboarded(uid: string, settings: OnboardedSettings): Promise<void>;
}

export interface ProfileRepository {
  get(uid: string): Promise<Profile | null>;
  save(uid: string, profile: { username: string; displayName: string }): Promise<void>;
}

export interface UsernameRepository {
  /** uid that reserved this normalized username, or null if free. */
  getOwner(username: string): Promise<string | null>;
  /** Must fail if the reservation already exists. */
  reserve(username: string, uid: string): Promise<void>;
}

export interface IdentityRepositories {
  users: UserSettingsRepository;
  profiles: ProfileRepository;
  usernames: UsernameRepository;
}

// ---- Non-transactional ports ----

export interface IdentityQueries {
  getMe(uid: string): Promise<{ profile: Profile | null; onboardingCompleted: boolean }>;
  /** uid that reserved this normalized username, or null if it is free. */
  getUsernameOwner(username: string): Promise<string | null>;
}

export interface SeedReferences {
  tagIds: string[];
  songIds: string[];
  artistIds: string[];
}

/** Confirms onboarding choices point at real, active catalog items. */
export interface SeedReferenceChecker {
  /** Returns the missing/inactive references, e.g. ["tag:genre_xyz"]. Empty means all good. */
  findMissing(refs: SeedReferences): Promise<string[]>;
}
