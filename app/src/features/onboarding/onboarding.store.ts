import { create } from "zustand";

import { ONBOARDING_LIMITS } from "@/domain/onboarding";

/** Adds or removes `id`. Adding is ignored once `max` items are selected. */
export function toggleWithLimit(list: readonly string[], id: string, max: number): string[] {
  if (list.includes(id)) return list.filter((item) => item !== id);
  return list.length >= max ? [...list] : [...list, id];
}

interface OnboardingDraft {
  /** The user this draft belongs to; a different user starts from an empty draft. */
  ownerUid: string | null;
  tagIds: string[];
  songIds: string[];
  artistIds: string[];
  claim: (uid: string) => void;
  toggleTag: (id: string) => void;
  toggleSong: (id: string) => void;
  toggleArtist: (id: string) => void;
  clearTags: () => void;
  clearSongs: () => void;
  clearArtists: () => void;
  reset: () => void;
}

const empty = { ownerUid: null, tagIds: [], songIds: [], artistIds: [] };

/**
 * Choices made across steps 2-4. They are sent in one request at the final step (S09), so a user
 * who quits halfway resumes at S06 with nothing half-saved on the server.
 */
export const useOnboardingDraft = create<OnboardingDraft>((set) => ({
  ...empty,
  claim: (uid) => set((state) => (state.ownerUid === uid ? state : { ...empty, ownerUid: uid })),
  toggleTag: (id) =>
    set((state) => ({ tagIds: toggleWithLimit(state.tagIds, id, ONBOARDING_LIMITS.tags) })),
  toggleSong: (id) =>
    set((state) => ({ songIds: toggleWithLimit(state.songIds, id, ONBOARDING_LIMITS.songs) })),
  toggleArtist: (id) =>
    set((state) => ({
      artistIds: toggleWithLimit(state.artistIds, id, ONBOARDING_LIMITS.artists),
    })),
  clearTags: () => set({ tagIds: [] }),
  clearSongs: () => set({ songIds: [] }),
  clearArtists: () => set({ artistIds: [] }),
  reset: () => set({ ...empty }),
}));
