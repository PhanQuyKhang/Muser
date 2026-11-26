import type { Clock } from "../../../shared/clock";
import { AppError } from "../../../shared/errors";
import type { Song } from "../../catalog/domain/catalog";
import type { Preview, PreviewProvider } from "./ports/preview-provider";

/** A cached link is reused only while it still has this long to live. */
const MIN_REMAINING_MS = 5 * 60_000;

export interface MediaDependencies {
  /** Throws NOT_FOUND for a missing or inactive song. */
  songs: { getSong(id: string): Promise<Song> };
  previews: PreviewProvider;
  clock: Clock;
}

export class MediaService {
  // Per instance and bounded by the catalog size. Links are never persisted.
  private readonly cache = new Map<string, Preview>();

  constructor(private readonly d: MediaDependencies) {}

  async issuePreview(songId: string): Promise<Preview> {
    // Checked before the cache so a withdrawn song stops playing at once.
    const song = await this.d.songs.getSong(songId);

    const cached = this.cache.get(songId);
    if (cached && cached.expiresAt.getTime() - this.d.clock.now().getTime() > MIN_REMAINING_MS) {
      return cached;
    }

    let preview: Preview | null;
    try {
      preview = await this.d.previews.findPreview({
        title: song.title,
        artistName: song.artistNames[0] ?? "",
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          severity: "ERROR",
          operation: "findPreview",
          songId,
          message: error instanceof Error ? error.message : "unknown",
        }),
      );
      throw new AppError("UNAVAILABLE", "Previews are unavailable right now");
    }
    if (!preview) throw new AppError("NOT_FOUND", "No preview for this song");

    this.cache.set(songId, preview);
    return preview;
  }
}
