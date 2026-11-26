// Which search result is "this song". Pure: no HTTP and no Firebase.

export interface PreviewCandidate {
  title: string;
  artistName: string;
  /** Empty when the provider has no clip for the track. */
  previewUrl: string;
}

export interface WantedSong {
  title: string;
  artistName: string;
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

/**
 * The candidate by the same artist with the same title, else the same title followed by a
 * suffix such as "Remastered". Never another artist's song, and null rather than a guess.
 */
export function pickPreview<T extends PreviewCandidate>(candidates: T[], wanted: WantedSong): T | null {
  const title = normalizeName(wanted.title);
  const artist = normalizeName(wanted.artistName);
  const byArtist = candidates.filter((c) => c.previewUrl && normalizeName(c.artistName) === artist);

  const exact = byArtist.find((c) => normalizeName(c.title) === title);
  if (exact) return exact;

  return (
    byArtist.find((c) => {
      const found = normalizeName(c.title);
      return found.startsWith(`${title} `) && !VARIANTS.test(found.slice(title.length));
    }) ?? null
  );
}
