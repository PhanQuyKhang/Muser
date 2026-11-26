// Which search result is "this song". Pure: no HTTP and no Firebase.

export interface PreviewCandidate {
  title: string;
  artistName: string;
  /** Empty when the provider has no clip for the track. */
  previewUrl: string;
  albumTitle?: string;
}

export interface WantedSong {
  title: string;
  artistName: string;
  /** The release the catalog means, so the cover is not a compilation's. */
  albumTitle?: string | undefined;
}

// Other recordings of a song: only acceptable when the wanted title asks for one.
const VARIANTS = /\b(remix|live|acoustic|karaoke|instrumental|cover|sped up|slowed)\b/;

export const normalizeName = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Whether a track is on the wanted release, ignoring suffixes such as "(Deluxe)". */
export function isOnAlbum(candidate: PreviewCandidate, wanted: WantedSong): boolean {
  const album = normalizeName(wanted.albumTitle ?? "");
  return album !== "" && normalizeName(candidate.albumTitle ?? "").startsWith(album);
}

/**
 * A track by the same artist with the same title, or the same title followed by a suffix such
 * as "Remastered". One from the wanted album comes first, then the exact title. Never
 * another artist's song, and null rather than a guess.
 */
export function pickPreview<T extends PreviewCandidate>(candidates: T[], wanted: WantedSong): T | null {
  const title = normalizeName(wanted.title);
  const artist = normalizeName(wanted.artistName);
  const isExact = (c: T) => normalizeName(c.title) === title;

  const usable = candidates.filter((c) => {
    if (!c.previewUrl || normalizeName(c.artistName) !== artist) return false;
    if (isExact(c)) return true;
    const found = normalizeName(c.title);
    return found.startsWith(`${title} `) && !VARIANTS.test(found.slice(title.length));
  });
  const onAlbum = usable.filter((c) => isOnAlbum(c, wanted));
  const pool = onAlbum.length > 0 ? onAlbum : usable;

  return pool.find(isExact) ?? pool[0] ?? null;
}
