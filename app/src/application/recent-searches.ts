import { create } from "zustand";

const LIMIT = 4;

interface RecentSearchesState {
  /** Newest first. Kept for this session only, and cleared when the user changes. */
  items: string[];
  add: (query: string) => void;
  clear: () => void;
}

export const useRecentSearches = create<RecentSearchesState>((set) => ({
  items: [],
  add: (query) =>
    set(({ items }) => {
      const text = query.trim();
      if (!text) return { items };
      const others = items.filter((item) => item.toLowerCase() !== text.toLowerCase());
      return { items: [text, ...others].slice(0, LIMIT) };
    }),
  clear: () => set({ items: [] }),
}));
