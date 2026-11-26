import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useServices } from "@/application/services";
import type { Song } from "@/domain/catalog";
import { matchesSong, normalizeText } from "@/features/library/filter";
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

export interface ArtistSummary {
  id: string;
  name: string;
  /** A song this artist leads, used to find their picture. */
  songId?: string;
}

/** Every artist credited on these songs, once each, in the order they first appear. */
export function artistsOf(songs: Song[]): ArtistSummary[] {
  const found = new Map<string, ArtistSummary>();
  for (const song of songs) {
    song.artistIds.forEach((id, index) => {
      const name = song.artistNames[index];
      if (!name) return;
      const artist = found.get(id) ?? { id, name };
      if (index === 0 && !artist.songId) artist.songId = song.id;
      found.set(id, artist);
    });
  }
  return [...found.values()];
}

/** Global Search filters the cached catalog on the device, after a short typing pause. */
export function useSongSearch(rawQuery: string) {
  const catalog = useCatalogSongs();
  const query = useDebouncedValue(rawQuery.trim(), 300);
  const results = useMemo(
    () => (query ? (catalog.data ?? []).filter((song) => matchesSong(song, query)) : []),
    [catalog.data, query],
  );
  const artists = useMemo(() => {
    if (!query) return [];
    const needle = normalizeText(query);
    return artistsOf(results).filter((artist) => normalizeText(artist.name).includes(needle));
  }, [results, query]);

  return {
    results,
    artists,
    typed: rawQuery.trim().length > 0,
    loading: catalog.isLoading || rawQuery.trim() !== query,
    error: catalog.isError,
    refetch: () => void catalog.refetch(),
  };
}
