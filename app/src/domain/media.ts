/** A short-lived link to a 30-second clip. The app streams it and stores no audio. */
export interface PreviewLink {
  url: string;
  expiresAt: string;
}

/** Picture links for a song. Null means there is none, and a colored tile is shown. */
export interface Artwork {
  coverUrl: string | null;
  artistImageUrl: string | null;
}

export interface MediaRepository {
  getArtwork(songId: string): Promise<Artwork>;
  /** Null when the song has no preview. Rejects when it cannot be asked for. */
  getPreview(songId: string): Promise<PreviewLink | null>;
}
