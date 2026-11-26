import type { Artwork, MediaRepository, PreviewLink } from "@/domain/media";
import { ApiError, type ApiClient } from "./client";

export class ApiMediaRepository implements MediaRepository {
  constructor(private readonly api: ApiClient) {}

  async getArtwork(songId: string): Promise<Artwork> {
    try {
      const { coverUrl, artistImageUrl } = await this.api.get<Artwork>(
        `/media/${encodeURIComponent(songId)}/artwork`,
      );
      return { coverUrl, artistImageUrl };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { coverUrl: null, artistImageUrl: null };
      }
      throw error;
    }
  }

  async getPreview(songId: string): Promise<PreviewLink | null> {
    try {
      const { url, expiresAt } = await this.api.post<PreviewLink>(
        `/media/${encodeURIComponent(songId)}/playback`,
      );
      return { url, expiresAt };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }
}
