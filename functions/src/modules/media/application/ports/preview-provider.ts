import type { WantedSong } from "../../domain/preview";

/** A short clip hosted by someone else. The link stops working at `expiresAt`. */
export interface Preview {
  url: string;
  expiresAt: Date;
}

export interface PreviewProvider {
  /** Null when there is no clip for this song. Throws when the provider cannot be asked. */
  findPreview(song: WantedSong): Promise<Preview | null>;
}
