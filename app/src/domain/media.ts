/** A short-lived link to a 30-second clip. The app streams it and stores no audio. */
export interface PreviewLink {
  url: string;
  expiresAt: string;
}

export interface MediaRepository {
  /** Null when the song has no preview. Rejects when it cannot be asked for. */
  getPreview(songId: string): Promise<PreviewLink | null>;
}
