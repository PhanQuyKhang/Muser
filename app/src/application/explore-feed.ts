import { create } from "zustand";

import { isExploreQueue, usePlayerStore } from "./player";

export type ExploreFeed = "mine" | "friends";

interface ExploreFeedState {
  feed: ExploreFeed;
  /** Also reachable from the Friends tab ("Hear what they love"). */
  setFeed: (feed: ExploreFeed) => void;
}

export const useExploreFeed = create<ExploreFeedState>((set, get) => ({
  feed: "mine",
  setFeed: (feed) => {
    if (feed === get().feed) return;
    // The other feed loads its own queue; the old card must not keep playing in between.
    const { queue, release } = usePlayerStore.getState();
    if (queue && isExploreQueue(queue.id)) release();
    set({ feed });
  },
}));
