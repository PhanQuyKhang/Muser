// READ-ONLY report: looks up every catalog song on Deezer (+ Last.fm tags) and
// prints what was found. It downloads NO audio or images and writes NO catalog data.
// Output: out/enrich-report.json (git-ignored) + a console summary.

import { mkdirSync, writeFileSync } from "node:fs";
import { albums, artists, songs } from "./catalog";

try {
  process.loadEnvFile(".env");
} catch {
  /* .env optional; Last.fm is skipped without a key */
}
const LASTFM_KEY = process.env.LASTFM_API_KEY?.trim();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slug = (s: string) => norm(s).replace(/ /g, "_");

// Map free-form external tags to our fixed tag ids.
const GENRE_MAP: Record<string, string> = {
  pop: "genre_pop", rock: "genre_rock", "alternative": "genre_alternative", "alternative rock": "genre_alternative",
  indie: "genre_indie", "indie rock": "genre_indie", "indie pop": "genre_indie", rap: "genre_hip_hop",
  "hip hop": "genre_hip_hop", "hip-hop": "genre_hip_hop", "r&b": "genre_rnb", rnb: "genre_rnb", soul: "genre_rnb",
  electronic: "genre_electronic", electro: "genre_electronic", dance: "genre_electronic", house: "genre_electronic",
  jazz: "genre_jazz",
};
const MOOD_MAP: Record<string, string> = {
  chill: "mood_chill", chillout: "mood_chill", relaxing: "mood_chill", mellow: "mood_chill", calm: "mood_chill",
  happy: "mood_happy", "feel good": "mood_happy", upbeat: "mood_happy", fun: "mood_happy", summer: "mood_happy",
  energetic: "mood_energetic", energy: "mood_energetic", driving: "mood_energetic", aggressive: "mood_energetic",
  melancholy: "mood_melancholy", melancholic: "mood_melancholy", sad: "mood_melancholy", depressing: "mood_melancholy",
  romantic: "mood_romantic", love: "mood_romantic", sensual: "mood_romantic", sexy: "mood_romantic",
  dreamy: "mood_dreamy", "dream pop": "mood_dreamy", psychedelic: "mood_dreamy", ethereal: "mood_dreamy", atmospheric: "mood_dreamy",
  focus: "mood_focus", instrumental: "mood_focus", ambient: "mood_focus", study: "mood_focus",
  party: "mood_party", club: "mood_party",
};

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "muser-student-project/0.1" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface DeezerTrack {
  id: number; title: string; duration: number; explicit_lyrics: boolean; preview: string; rank?: number;
  artist: { name: string; picture_xl?: string };
  album: { id: number; title: string; cover_xl?: string };
}

const albumGenreCache = new Map<number, string[]>();
async function deezerAlbumGenres(albumId: number): Promise<string[]> {
  if (albumGenreCache.has(albumId)) return albumGenreCache.get(albumId)!;
  await sleep(150);
  const d = await getJson<{ genres?: { data: { name: string }[] } }>(`https://api.deezer.com/album/${albumId}`);
  const names = d?.genres?.data.map((g) => g.name) ?? [];
  albumGenreCache.set(albumId, names);
  return names;
}

async function deezerFind(artist: string, title: string, album: string): Promise<DeezerTrack | null> {
  // Plain query + client-side filtering: Deezer's advanced artist:/track: syntax returned nothing.
  const q = encodeURIComponent(`${artist} ${title}`);
  await sleep(150); // Deezer allows ~50 requests / 5s
  const d = await getJson<{ data?: DeezerTrack[] }>(`https://api.deezer.com/search?q=${q}&limit=25`);
  const list = d?.data ?? [];
  const exact = list.filter((t) => norm(t.artist.name) === norm(artist) && norm(t.title).startsWith(norm(title)));
  return exact.find((t) => norm(t.album.title).includes(norm(album).slice(0, 12))) ?? exact[0] ?? null;
}

async function lastfmMoods(artist: string, title: string): Promise<{ moods: string[]; genres: string[]; raw: string[] } | null> {
  if (!LASTFM_KEY) return null;
  await sleep(250);
  const url =
    `https://ws.audioscrobbler.com/2.0/?method=track.getTopTags&format=json&autocorrect=1` +
    `&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&api_key=${LASTFM_KEY}`;
  const d = await getJson<{ toptags?: { tag: { name: string; count: number }[] } }>(url);
  const tags = d?.toptags?.tag ?? [];
  const score = (map: Record<string, string>) => {
    const acc = new Map<string, number>();
    for (const t of tags.slice(0, 30)) {
      const id = map[t.name.toLowerCase()];
      if (id) acc.set(id, (acc.get(id) ?? 0) + t.count);
    }
    return [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
  };
  return { moods: score(MOOD_MAP), genres: score(GENRE_MAP), raw: tags.slice(0, 8).map((t) => t.name) };
}

async function main() {
  console.log(LASTFM_KEY ? "Last.fm key: loaded" : "Last.fm key: MISSING (mood suggestions skipped)");
  const artistName = new Map(artists.map((a) => [a.id, a.name]));
  const albumById = new Map(albums.map((a) => [a.id, a]));
  const rows: Record<string, unknown>[] = [];
  let missing = 0, noPreview = 0;

  for (const s of songs) {
    const album = albumById.get(s.albumId)!;
    const artist = artistName.get(album.artistId)!;
    const id = `song_${slug(s.title)}`;
    const t = await deezerFind(artist, s.title, album.title);
    if (!t) { missing++; rows.push({ id, artist, title: s.title, found: false }); console.log(`MISS   ${artist} - ${s.title}`); continue; }
    if (!t.preview) noPreview++;
    const dzGenres = await deezerAlbumGenres(t.album.id);
    const dzGenreIds = [...new Set(dzGenres.map((g) => GENRE_MAP[g.toLowerCase()]).filter(Boolean))];
    const lf = await lastfmMoods(artist, s.title);
    const ours = s.tagIds;
    rows.push({
      id, artist, title: s.title, found: true, deezerTrackId: t.id, hasPreview: !!t.preview,
      deezerDurationSec: t.duration, deezerRank: t.rank ?? null, explicit: t.explicit_lyrics, ourExplicit: !!s.explicit,
      albumMatch: norm(t.album.title).startsWith(norm(album.title).slice(0, 12)),
      deezerAlbum: t.album.title, deezerGenres: dzGenres,
      ourTags: ours, suggestedGenres: dzGenreIds, lastfmGenres: lf?.genres, lastfmMoods: lf?.moods, lastfmRaw: lf?.raw,
    });
    console.log(`${t.preview ? "OK    " : "NOPREV"} ${artist} - ${s.title} | genres[${dzGenres.join(",")}] moods[${lf?.moods.join(",") ?? "-"}]`);
  }

  mkdirSync("out", { recursive: true });
  writeFileSync("out/enrich-report.json", JSON.stringify(rows, null, 2));
  console.log(`\n${songs.length} songs: ${songs.length - missing} found, ${missing} missing, ${noPreview} without preview.`);
  console.log("Report: out/enrich-report.json (nothing downloaded, nothing written to Firestore)");
}

main().catch((e) => { console.error(e); process.exit(1); });
