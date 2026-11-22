import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "node:fs";
import { albums, artists, songs, tags } from "./catalog";

// Optional: Deezer popularity ranks produced by `npm run enrich` (out/enrich-report.json).
// Higher rank = more popular (relative score, NOT a play count). Missing file => field omitted.
const popularityById = new Map<string, number>();
if (existsSync("out/enrich-report.json")) {
  const rows = JSON.parse(readFileSync("out/enrich-report.json", "utf8")) as { id: string; deezerRank?: number | null }[];
  for (const r of rows) if (typeof r.deezerRank === "number") popularityById.set(r.id, r.deezerRank);
}

const args = new Set(process.argv.slice(2));
const projectArg = process.argv.find((a) => a.startsWith("--project="))?.split("=")[1];
const dryRun = args.has("--dry-run");
const emulator = process.env.FIRESTORE_EMULATOR_HOST;

const normalize = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const slug = (s: string) =>
  normalize(s).replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

interface Doc {
  path: string;
  data: Record<string, unknown>;
}

function build(): Doc[] {
  const now = FieldValue.serverTimestamp();
  const docs: Doc[] = [];
  const errors: string[] = [];

  const tagIds = new Set<string>();
  for (const t of tags) {
    if (!t.id.startsWith(`${t.category}_`)) errors.push(`tag ${t.id}: id must start with "${t.category}_"`);
    if (tagIds.has(t.id)) errors.push(`duplicate tag ${t.id}`);
    tagIds.add(t.id);
    docs.push({ path: `tags/${t.id}`, data: { label: t.label, category: t.category, status: "active" } });
  }

  const checkTags = (owner: string, ids: string[]) => {
    for (const id of ids) if (!tagIds.has(id)) errors.push(`${owner}: unknown tag ${id}`);
  };

  const artistById = new Map<string, string>();
  for (const a of artists) {
    if (artistById.has(a.id)) errors.push(`duplicate artist ${a.id}`);
    artistById.set(a.id, a.name);
    checkTags(a.id, a.tagIds);
    docs.push({
      path: `artists/${a.id}`,
      data: {
        name: a.name,
        normalizedName: normalize(a.name),
        imagePath: `catalog/artists/${a.id}/v1.jpg`,
        tagIds: a.tagIds,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  const albumById = new Map<string, (typeof albums)[number]>();
  for (const al of albums) {
    if (albumById.has(al.id)) errors.push(`duplicate album ${al.id}`);
    albumById.set(al.id, al);
    if (!artistById.has(al.artistId)) errors.push(`${al.id}: unknown artist ${al.artistId}`);
    docs.push({
      path: `albums/${al.id}`,
      data: {
        title: al.title,
        normalizedTitle: normalize(al.title),
        artistIds: [al.artistId],
        coverPath: `catalog/covers/${al.id}/v1.jpg`,
        releaseDate: al.releaseDate,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  const songIds = new Set<string>();
  for (const s of songs) {
    const id = `song_${slug(s.title)}`;
    if (songIds.has(id)) errors.push(`duplicate song id ${id} (${s.title})`);
    songIds.add(id);
    const album = albumById.get(s.albumId);
    if (!album) {
      errors.push(`${id}: unknown album ${s.albumId}`);
      continue;
    }
    const artistIds = s.artistIds ?? [album.artistId];
    for (const aid of artistIds) if (!artistById.has(aid)) errors.push(`${id}: unknown artist ${aid}`);
    if (!artistIds.includes(album.artistId)) errors.push(`${id}: artists must include album artist ${album.artistId}`);
    checkTags(id, s.tagIds);
    if (!s.tagIds.some((t) => t.startsWith("genre_"))) errors.push(`${id}: needs at least one genre tag`);
    if (!s.tagIds.some((t) => t.startsWith("mood_"))) errors.push(`${id}: needs at least one mood tag`);

    const peakSec = s.peakSec ?? Math.round(s.durationSec * 0.3); // placeholder: 30% of duration until curated
    if (peakSec < 0 || peakSec >= s.durationSec) errors.push(`${id}: peakSec must be within the song`);

    docs.push({
      path: `songs/${id}`,
      data: {
        title: s.title,
        normalizedTitle: normalize(s.title),
        artistIds,
        artistNames: artistIds.map((a) => artistById.get(a)),
        albumId: s.albumId,
        coverPath: `catalog/covers/${s.albumId}/v1.jpg`,
        durationMs: s.durationSec * 1000,
        peakStartMs: peakSec * 1000, // top-level per MUSER_DATABASE.md; 0 <= value < durationMs
        tagIds: s.tagIds,
        explicit: s.explicit ?? false,
        ...(popularityById.has(id) ? { popularityRank: popularityById.get(id) } : {}),
        status: "active",
        audio: {
          storagePath: `catalog/audio/${id}/v1.mp3`,
          mimeType: "audio/mpeg",
          bitrateKbps: 128,
        },
        rights: { source: "metadata-only", attribution: "Placeholder audio path; no audio licensed." },
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  if (errors.length) {
    console.error(`Validation failed (${errors.length}):\n - ${errors.join("\n - ")}`);
    process.exit(1);
  }
  return docs;
}

async function main() {
  const all = build(); // validates the whole catalog regardless of --only
  const count = (p: string) => all.filter((d) => d.path.startsWith(p)).length;
  console.log(
    `Validated: ${count("tags/")} tags, ${count("artists/")} artists, ${count("albums/")} albums, ${count("songs/")} songs`,
  );
  if (dryRun) {
    console.log("Dry run: nothing written.");
    return;
  }

  const fail = (msg: string): never => {
    console.error(msg);
    process.exit(1);
  };
  const argValue = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

  // Environment: the emulator is detected automatically; real projects must say which one.
  const env = emulator ? "emulator" : argValue("env");
  if (!env || !["emulator", "dev", "staging", "prod"].includes(env)) {
    fail("Pass --env=dev|staging|prod --project=<id> --yes for a real project, or set FIRESTORE_EMULATOR_HOST.");
  }
  if (!emulator && !projectArg) fail("Real project needs --project=<id>.");
  if (!emulator && !args.has("--yes")) fail(`About to write to REAL ${env} project "${projectArg}". Re-run with --yes to confirm.`);

  // reference = tags (safe everywhere); demo = placeholder artists/albums/songs (never prod).
  const only = argValue("only") ?? (env === "prod" ? "reference" : "all");
  if (!["reference", "demo", "all"].includes(only)) fail('--only must be "reference", "demo" or "all".');
  if (env === "prod" && only !== "reference") {
    fail("The demo catalog (placeholder audio, preview-only) must never be seeded into prod. Use --only=reference and load the real catalog through the approved import.");
  }
  const docs = all.filter((d) => only === "all" || (only === "reference") === d.path.startsWith("tags/"));

  initializeApp({ projectId: projectArg ?? process.env.GCLOUD_PROJECT ?? "demo-muser" });
  const db = getFirestore();
  console.log(`Target: ${emulator ? `emulator ${emulator}` : `${env} project ${projectArg}`} | only=${only} | ${docs.length} documents`);

  const CHUNK = 400; // Firestore batch limit is 500 operations
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + CHUNK)) batch.set(db.doc(d.path), d.data); // fixed IDs + set() = idempotent
    await batch.commit();
  }
  console.log(`Wrote ${docs.length} documents.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
