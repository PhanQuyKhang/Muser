import type { Clock } from "../../../shared/clock";
import { AppError } from "../../../shared/errors";
import type { Song } from "../../catalog/domain/catalog";
import type { Artwork, Preview, PreviewProvider } from "./ports/preview-provider";

/** A cached link is reused only while it still has this long to live. */
const MIN_REMAINING_MS = 5 * 60_000;

export interface MediaDependencies {
  /** Throws NOT_FOUND for a missing or inactive song. */
  songs: {
    getSong(id: string): Promise<Song>;
    getAlbumTitle(albumId: string): Promise<string | null>;
  };
  previews: PreviewProvider;
  clock: Clock;
}

export class MediaService {
  // Per instance and bounded by the catalog size. Links are never persisted.
  private readonly previews = new Map<string, Preview>();
  private readonly artwork = new Map<string, Artwork>();
  /** Lookups under way, so a cover and a clip asked together cost one search. */
  private readonly pending = new Map<string, Promise<Preview | null>>();

  constructor(private readonly d: MediaDependencies) {}

  async issuePreview(songId: string): Promise<Preview> {
    // Checked before the cache so a withdrawn song stops playing at once.
    const song = await this.d.songs.getSong(songId);

    const cached = this.previews.get(songId);
    if (cached && cached.expiresAt.getTime() - this.d.clock.now().getTime() > MIN_REMAINING_MS) {
      return cached;
    }

    const preview = await this.lookUp(song);
    if (!preview) throw new AppError("NOT_FOUND", "No preview for this song");
    return preview;
  }

  /** Cover and artist picture. Both are null when the provider does not know the song. */
  async getArtwork(songId: string): Promise<Artwork> {
    const song = await this.d.songs.getSong(songId);

    const cached = this.artwork.get(songId);
    if (cached) return cached;

    await this.lookUp(song);
    return this.artwork.get(songId) ?? { coverUrl: null, artistImageUrl: null };
  }

  private lookUp(song: Song): Promise<Preview | null> {
    const running = this.pending.get(song.id);
    if (running) return running;

    const search = this.search(song).finally(() => this.pending.delete(song.id));
    this.pending.set(song.id, search);
    return search;
  }

  private async search(song: Song): Promise<Preview | null> {
    let preview: Preview | null;
    try {
      const albumTitle = song.albumId ? await this.d.songs.getAlbumTitle(song.albumId) : null;
      preview = await this.d.previews.findPreview({
        title: song.title,
        artistName: song.artistNames[0] ?? "",
        albumTitle: albumTitle ?? undefined,
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          severity: "ERROR",
          operation: "findPreview",
          songId: song.id,
          message: error instanceof Error ? error.message : "unknown",
        }),
      );
      throw new AppError("UNAVAILABLE", "Previews are unavailable right now");
    }

    // A miss is remembered for the pictures, so every list does not search it again.
    this.artwork.set(song.id, {
      coverUrl: preview?.coverUrl ?? null,
      artistImageUrl: preview?.artistImageUrl ?? null,
    });
    if (preview) this.previews.set(song.id, preview);
    return preview;
  }
}
