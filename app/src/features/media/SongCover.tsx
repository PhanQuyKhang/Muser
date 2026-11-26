import { CoverArt, type CoverArtProps } from "@/shared/ui/CoverArt";
import { useArtwork } from "./hooks";

/** A song's cover, with the colored letter tile until it arrives. */
export function SongCover({ songId, ...tile }: Omit<CoverArtProps, "uri"> & { songId: string }) {
  const artwork = useArtwork(songId);
  return <CoverArt {...tile} uri={artwork?.coverUrl} />;
}
