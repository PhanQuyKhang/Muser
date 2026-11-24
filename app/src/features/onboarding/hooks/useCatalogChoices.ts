import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useServices } from "@/application/services";
import type { Artist, Song } from "@/domain/catalog";
import { useDebouncedValue } from "@/shared/utils/useDebouncedValue";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useTags() {
  const { catalog } = useServices();
  return useQuery({
    queryKey: ["catalog", "tags"],
    queryFn: () => catalog.listTags(),
    staleTime: FIVE_MINUTES,
  });
}

/** Most popular first; songs without a rank go last. */
export function byPopularity(a: Song, b: Song): number {
  return (b.popularityRank ?? -1) - (a.popularityRank ?? -1);
}

/** Starter suggestions when the search box is empty, search results otherwise (debounced). */
export function useSongChoices(rawQuery: string) {
  const { catalog } = useServices();
  const query = useDebouncedValue(rawQuery.trim(), 300);
  const searching = query.length > 0;

  const starter = useQuery({
    queryKey: ["catalog", "songs", "starter"],
    queryFn: async () => (await catalog.listSongs({ limit: 12 })).items,
    staleTime: FIVE_MINUTES,
    enabled: !searching,
  });
  const found = useQuery({
    queryKey: ["catalog", "search", query],
    queryFn: async () => (await catalog.search(query)).songs,
    enabled: searching,
  });

  const active = searching ? found : starter;
  const songs = useMemo(() => [...(active.data ?? [])].sort(byPopularity), [active.data]);
  // Typing ahead of the debounce window is still "loading" from the user's point of view.
  const pending = rawQuery.trim() !== query;

  return {
    songs,
    searching: rawQuery.trim().length > 0,
    loading: active.isLoading || pending,
    error: active.isError,
    refetch: () => void active.refetch(),
  };
}

/** Artists, paged from the API and filtered locally by the search text. */
export function useArtistChoices(rawQuery: string) {
  const { catalog } = useServices();
  const query = useInfiniteQuery({
    queryKey: ["catalog", "artists"],
    queryFn: ({ pageParam }) => catalog.listArtists({ limit: 20, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: FIVE_MINUTES,
  });

  const artists = useMemo<Artist[]>(() => {
    const all = query.data?.pages.flatMap((page) => page.items) ?? [];
    const needle = rawQuery.trim().toLowerCase();
    return needle ? all.filter((artist) => artist.name.toLowerCase().includes(needle)) : all;
  }, [query.data, rawQuery]);

  return {
    artists,
    loading: query.isLoading,
    error: query.isError,
    refetch: () => void query.refetch(),
    hasMore: query.hasNextPage && rawQuery.trim() === "",
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
  };
}
