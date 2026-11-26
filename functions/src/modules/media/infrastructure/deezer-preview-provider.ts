import type { Clock } from "../../../shared/clock";
import type { Preview, PreviewProvider } from "../application/ports/preview-provider";
import { isOnAlbum, pickPreview, type WantedSong } from "../domain/preview";

const SEARCH_URL = "https://api.deezer.com/search";
const TIMEOUT_MS = 8_000;
/** Assumed lifetime when a link does not say when it expires. */
const DEFAULT_LIFETIME_MS = 10 * 60_000;

/** Deezer allows about 50 requests in 5 seconds; a screen of covers asks for many at once. */
const SPACING_MS = 110;

interface SearchResponse {
  data?: {
    title?: string;
    preview?: string;
    artist?: { name?: string; picture_big?: string };
    album?: { title?: string; cover_big?: string };
  }[];
}

const httpsOrNull = (url: string | undefined) => (url?.startsWith("https://") ? url : null);

/** Deezer's public search: previews and pictures, no API key. Nothing is downloaded here. */
export class DeezerPreviewProvider implements PreviewProvider {
  private nextRequestAt = 0;

  constructor(
    private readonly clock: Clock,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async findPreview(song: WantedSong): Promise<Preview | null> {
    const words = `${song.artistName} ${song.title}`;
    let match = pickPreview(await this.search(words), song);

    // The usual results can miss the original release: ask for it by name.
    if (song.albumTitle && !(match && isOnAlbum(match, song))) {
      const narrowed = pickPreview(await this.search(`${words} ${song.albumTitle}`), song);
      if (narrowed && (!match || isOnAlbum(narrowed, song))) match = narrowed;
    }
    if (!match) return null;

    return {
      url: match.previewUrl,
      expiresAt: this.expiryOf(match.previewUrl),
      coverUrl: match.coverUrl,
      artistImageUrl: match.artistImageUrl,
    };
  }

  private async search(words: string) {
    await this.takeTurn();
    const response = await this.fetchImpl(`${SEARCH_URL}?q=${encodeURIComponent(words)}&limit=25`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Deezer search failed with status ${response.status}`);

    // Deezer reports quota and other errors as 200 with an `error` body instead of `data`.
    const { data } = (await response.json()) as SearchResponse;
    if (!data) throw new Error("Deezer search returned no data");

    return data.map((track) => ({
      title: track.title ?? "",
      artistName: track.artist?.name ?? "",
      albumTitle: track.album?.title ?? "",
      previewUrl: track.preview ?? "",
      coverUrl: httpsOrNull(track.album?.cover_big),
      artistImageUrl: httpsOrNull(track.artist?.picture_big),
    }));
  }

  /** Spaces requests out so a burst stays under Deezer's limit. */
  private async takeTurn(): Promise<void> {
    const now = Date.now();
    const at = Math.max(now, this.nextRequestAt);
    this.nextRequestAt = at + SPACING_MS;
    if (at > now) await new Promise((resolve) => setTimeout(resolve, at - now));
  }

  /** Preview links carry their expiry as `exp=<unix seconds>`. */
  private expiryOf(url: string): Date {
    const seconds = /[?&=~]exp=(\d+)/.exec(url)?.[1];
    return seconds
      ? new Date(Number(seconds) * 1000)
      : new Date(this.clock.now().getTime() + DEFAULT_LIFETIME_MS);
  }
}
