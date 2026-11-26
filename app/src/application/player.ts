import { create } from "zustand";

import type { Song } from "@/domain/catalog";

/** What the player is working through: one Explore feed, in its on-screen order. */
export interface Queue {
  id: string;
  songs: Song[];
  /** Playlist and Search lists move to the next song; an Explore card repeats. */
  autoAdvance?: boolean;
}

/** True for the queues behind the Explore cards. */
export const isExploreQueue = (id: string) => id === "friends" || id.startsWith("mine:");

/** The preferred song while it has not been passed, else the first one that has not. */
export function currentSong(
  songs: Song[],
  passed: readonly string[],
  preferredId: string | null,
): Song | null {
  const open = songs.filter((song) => !passed.includes(song.id));
  return open.find((song) => song.id === preferredId) ?? open[0] ?? null;
}

const NONE: readonly string[] = [];

interface PlayerState {
  queue: Queue | null;
  currentId: string | null;
  /** Songs already skipped or liked in each queue, oldest first, so every feed resumes. */
  passed: Record<string, readonly string[]>;
  /** The listener's choice. It holds across songs and screens. */
  paused: boolean;
  /** Loads a queue, or refreshes the loaded one without losing the current song. */
  activate: (queue: Queue) => void;
  /** Plays a list from the chosen song; the songs before it stay reachable with Previous. */
  play: (queue: Queue, songId: string) => void;
  /** Stops playback by unloading the queue. */
  release: () => void;
  advance: () => void;
  /** Returns to the song passed most recently. */
  back: () => void;
  restart: (queueId: string) => void;
  setPaused: (paused: boolean) => void;
  reset: () => void;
}

const empty = { queue: null, currentId: null, passed: {}, paused: false };

const sameSongs = (a: Song[], b: Song[]) =>
  a.length === b.length && a.every((song, index) => song.id === b[index]?.id);

/**
 * The single source of truth for what is playing. The Explore deck and the mini player both
 * read and change it, so they always agree.
 */
export const usePlayerStore = create<PlayerState>((set) => ({
  ...empty,

  activate: (queue) =>
    set((state) => {
      const loaded = state.queue?.id === queue.id ? state.queue : null;
      const preferred = loaded ? state.currentId : null;
      const currentId =
        currentSong(queue.songs, state.passed[queue.id] ?? NONE, preferred)?.id ?? null;
      if (loaded && currentId === state.currentId && sameSongs(loaded.songs, queue.songs)) {
        return state;
      }
      return { queue, currentId };
    }),

  play: (queue, songId) =>
    set((state) => {
      const from = queue.songs.findIndex((song) => song.id === songId);
      if (from < 0) return state;
      const passed = queue.songs.slice(0, from).map((song) => song.id);
      return {
        queue,
        currentId: songId,
        paused: false,
        passed: { ...state.passed, [queue.id]: passed },
      };
    }),

  release: () => set({ queue: null, currentId: null }),

  advance: () =>
    set((state) => {
      const { queue, currentId } = state;
      if (!queue || !currentId) return state;
      const passed = [...(state.passed[queue.id] ?? NONE), currentId];
      const from = queue.songs.findIndex((song) => song.id === currentId);
      const next =
        queue.songs.slice(from + 1).find((song) => !passed.includes(song.id)) ??
        currentSong(queue.songs, passed, null);
      return { passed: { ...state.passed, [queue.id]: passed }, currentId: next?.id ?? null };
    }),

  back: () =>
    set((state) => {
      const { queue } = state;
      if (!queue) return state;
      const passed = state.passed[queue.id] ?? NONE;
      const previous = passed.findLast((id) => queue.songs.some((song) => song.id === id));
      if (!previous) return state;
      return {
        passed: { ...state.passed, [queue.id]: passed.filter((id) => id !== previous) },
        currentId: previous,
      };
    }),

  restart: (queueId) =>
    set((state) => ({
      passed: { ...state.passed, [queueId]: NONE },
      currentId: state.queue?.id === queueId ? (state.queue.songs[0]?.id ?? null) : state.currentId,
    })),

  setPaused: (paused) => set({ paused }),

  reset: () => set(empty),
}));

export function useCurrentSong(): Song | null {
  return usePlayerStore(
    (state) => state.queue?.songs.find((song) => song.id === state.currentId) ?? null,
  );
}

export function useQueueEdges(): { canGoBack: boolean; canGoNext: boolean } {
  const canGoBack = usePlayerStore((state) => {
    const { queue } = state;
    if (!queue) return false;
    return (state.passed[queue.id] ?? NONE).some((id) =>
      queue.songs.some((song) => song.id === id),
    );
  });
  const canGoNext = usePlayerStore((state) => {
    const { queue } = state;
    if (!queue) return false;
    const passed = state.passed[queue.id] ?? NONE;
    return queue.songs.filter((song) => !passed.includes(song.id)).length > 1;
  });
  return { canGoBack, canGoNext };
}
