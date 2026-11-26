import type { Clock } from "../../../shared/clock";
import type { Preview, PreviewProvider } from "../application/ports/preview-provider";
import { pickPreview, type WantedSong } from "../domain/preview";

const SEARCH_URL = "https://api.deezer.com/search";
const TIMEOUT_MS = 8_000;
/** Assumed lifetime when a link does not say when it expires. */
const DEFAULT_LIFETIME_MS = 10 * 60_000;

interface SearchResponse {
  data?: { title?: string; preview?: string; artist?: { name?: string } }[];
}

/** Deezer's public search: 30-second MP3 previews, no API key. Nothing is downloaded here. */
export class DeezerPreviewProvider implements PreviewProvider {
  constructor(
    private readonly clock: Clock,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async findPreview(song: WantedSong): Promise<Preview | null> {
    const query = encodeURIComponent(`${song.artistName} ${song.title}`);
    const response = await this.fetchImpl(`${SEARCH_URL}?q=${query}&limit=25`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Deezer search failed with status ${response.status}`);

    // Deezer reports quota and other errors as 200 with an `error` body instead of `data`.
    const { data } = (await response.json()) as SearchResponse;
    if (!data) throw new Error("Deezer search returned no data");

    const match = pickPreview(
      data.map((track) => ({
        title: track.title ?? "",
        artistName: track.artist?.name ?? "",
        previewUrl: track.preview ?? "",
      })),
      song,
    );
    if (!match) return null;

    return { url: match.previewUrl, expiresAt: this.expiryOf(match.previewUrl) };
  }

  /** Preview links carry their expiry as `exp=<unix seconds>`. */
  private expiryOf(url: string): Date {
    const seconds = /[?&=~]exp=(\d+)/.exec(url)?.[1];
    return seconds
      ? new Date(Number(seconds) * 1000)
      : new Date(this.clock.now().getTime() + DEFAULT_LIFETIME_MS);
  }
}
