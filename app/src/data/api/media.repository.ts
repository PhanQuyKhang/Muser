import type { MediaRepository, PreviewLink } from "@/domain/media";
import { ApiError, type ApiClient } from "./client";

export class ApiMediaRepository implements MediaRepository {
  constructor(private readonly api: ApiClient) {}

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
