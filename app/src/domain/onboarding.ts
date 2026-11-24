/** Bounds enforced by the API (functions/.../onboarding.controller.ts); the UI stops at the same limits. */
export const ONBOARDING_LIMITS = { tags: 20, songs: 5, artists: 10 } as const;

/** Profile, music types, songs, artists, sharing. */
export const ONBOARDING_STEPS = 5;

export type OnboardingErrorCode = "username-taken" | "invalid" | "network" | "unknown";

export class OnboardingError extends Error {
  constructor(readonly code: OnboardingErrorCode) {
    super(code);
    this.name = "OnboardingError";
  }
}

export interface ProfileInput {
  username: string;
  displayName: string;
}

export interface OnboardingInput {
  seedTagIds: string[];
  seedSongIds: string[];
  seedArtistIds: string[];
  sharingEnabled: boolean;
}

export interface OnboardingRepository {
  /** S05: reserves the username and creates the profile. Replaying the same request is a no-op. */
  createProfile(input: ProfileInput): Promise<void>;
  /** Advisory only; createProfile decides. */
  isUsernameAvailable(username: string): Promise<boolean>;
  /** S09: saves taste choices and the sharing choice, finishing setup. */
  complete(input: OnboardingInput): Promise<void>;
}
