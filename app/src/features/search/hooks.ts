import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useServices } from "@/application/services";
import type { Song } from "@/domain/catalog";
import { matchesSong } from "@/features/library/filter";
import { useDebouncedValue } from "@/shared/utils/useDebouncedValue";

const FIVE_MINUTES = 5 * 60 * 1000;
const MAX_PAGES = 20;

/** The whole active catalog (50-100 tracks), fetched once and cached. */
export function useCatalogSongs() {
  const { catalog } = useServices();
  return useQuery({
    queryKey: ["catalog", "songs", "all"],
    staleTime: FIVE_MINUTES,
    queryFn: async () => {
      const songs: Song[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await catalog.listSongs({ limit: 50, cursor });
        songs.push(...result.items);
        if (!result.nextCursor) break;
        cursor = result.nextCursor;
      }
      return songs;
    },
  });
}

/** Global Search filters the cached catalog on the device, after a short typing pause. */
export function useSongSearch(rawQuery: string) {
  const catalog = useCatalogSongs();
  const query = useDebouncedValue(rawQuery.trim(), 300);
  const results = useMemo(
    () => (query ? (catalog.data ?? []).filter((song) => matchesSong(song, query)) : []),
    [catalog.data, query],
  );

  return {
    results,
    typed: rawQuery.trim().length > 0,
    loading: catalog.isLoading || rawQuery.trim() !== query,
    error: catalog.isError,
    refetch: () => void catalog.refetch(),
  };
}
