import { useQuery } from "@tanstack/react-query";

import { useServices } from "@/application/services";
import type { Artwork } from "@/domain/media";

const HALF_HOUR = 30 * 60_000;

/** The pictures of a song. Undefined while loading, and without a song. */
export function useArtwork(songId: string | undefined): Artwork | undefined {
  const { media } = useServices();
  return useQuery({
    queryKey: ["artwork", songId],
    queryFn: () => media.getArtwork(songId!),
    enabled: songId !== undefined,
    // Picture links do not expire, so one answer per song is enough.
    staleTime: Infinity,
    gcTime: HALF_HOUR,
    retry: 1,
  }).data;
}
