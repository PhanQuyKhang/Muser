import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { isExploreQueue, usePlayerStore } from "@/application/player";
import { useServices } from "@/application/services";
import type { Song } from "@/domain/catalog";
import type { DiscoveryLevel } from "@/domain/discovery";

export const RECOMMENDATIONS_KEY = ["recommendations"] as const;

/** Without a level the saved one is used. */
export function useRecommendations(level: DiscoveryLevel | undefined) {
  const { discovery } = useServices();
  return useQuery({
    queryKey: [...RECOMMENDATIONS_KEY, level ?? "saved"],
    queryFn: () => discovery.recommend(level),
    placeholderData: keepPreviousData,
    // The deck must not reshuffle while the listener is going through it.
    staleTime: Infinity,
  });
}

/** The first genre of a song, for the badge on its card. */
export function useGenreLabels(): (song: Song) => string | undefined {
  const { catalog } = useServices();
  const tags = useQuery({
    queryKey: ["tags"],
    queryFn: () => catalog.listTags(),
    staleTime: Infinity,
  });
  return (song) =>
    tags.data?.find((tag) => tag.category === "genre" && song.tagIds.includes(tag.id))?.label;
}

/** Stops playback while a feed has no card to show, so nothing plays without controls. */
export function useReleasePlayerWhen(noDeck: boolean) {
  useEffect(() => {
    const { queue, release } = usePlayerStore.getState();
    if (noDeck && queue && isExploreQueue(queue.id)) release();
  }, [noDeck]);
}
