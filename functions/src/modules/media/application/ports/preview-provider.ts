import type { WantedSong } from "../../domain/preview";

/** Pictures hosted by the provider. Unlike clips, these links do not expire. */
export interface Artwork {
  coverUrl: string | null;
  artistImageUrl: string | null;
}

/** A short clip hosted by someone else. The link stops working at `expiresAt`. */
export interface Preview extends Artwork {
  url: string;
  expiresAt: Date;
}

export interface PreviewProvider {
  /** Null when there is no clip for this song. Throws when the provider cannot be asked. */
  findPreview(song: WantedSong): Promise<Preview | null>;
}
