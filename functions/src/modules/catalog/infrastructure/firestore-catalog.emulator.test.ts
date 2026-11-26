import { initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../../bootstrap/app";
import type { IdentityServices } from "../../identity/identity.services";
import type { LibraryService } from "../../library/application/library.service";
import { CatalogService } from "../application/catalog.service";
import { FirestoreCatalogRepository } from "./firestore-catalog.repository";

// Runs the REAL Firestore repository against the Firestore EMULATOR (via `npm test`).
// NOTE: the emulator does not enforce composite indexes; these queries still need the
// indexes in firebase/firestore.indexes.json on a real project.
const host = process.env.FIRESTORE_EMULATOR_HOST;

const songDoc = (title: string, over: Record<string, unknown> = {}) => ({
  title,
  normalizedTitle: title.toLowerCase(),
  artistIds: ["artist_a"],
  artistNames: ["Alpha Band"],
  albumId: null,
  coverPath: "catalog/covers/x/v1.jpg",
  durationMs: 200000,
  peakStartMs: 60000,
  tagIds: ["genre_pop"],
  explicit: false,
  status: "active",
  audio: { storagePath: "catalog/audio/secret/v1.mp3", mimeType: "audio/mpeg", bitrateKbps: 128 },
  rights: { source: "metadata-only", attribution: "x" },
  ...over,
});

describe.skipIf(!host)("catalog against the Firestore emulator", () => {
  let db: Firestore;
  let repo: FirestoreCatalogRepository;

  beforeAll(() => {
    initializeApp({ projectId: "demo-muser" });
    db = getFirestore();
    repo = new FirestoreCatalogRepository(db);
  });

  beforeEach(async () => {
    await fetch(`http://${host}/emulator/v1/projects/demo-muser/databases/(default)/documents`, { method: "DELETE" });
    await db.doc("tags/genre_pop").set({ label: "Pop", category: "genre", status: "active" });
    await db.doc("tags/mood_old").set({ label: "Old", category: "mood", status: "archived" });
    await db.doc("artists/artist_a").set({ name: "Alpha Band", normalizedName: "alpha band", tagIds: [], status: "active" });
    await db.doc("artists/artist_gone").set({ name: "Gone", normalizedName: "gone", tagIds: [], status: "archived" });
    await db.doc("artists/artist_b").set({ name: "Beta Trio", normalizedName: "beta trio", imagePath: "catalog/artists/artist_b/v1.jpg", tagIds: ["genre_pop"], status: "active" });
    await db.doc("artists/artist_c").set({ name: "Cobalt", normalizedName: "cobalt", tagIds: ["genre_pop", "mood_chill"], status: "active" });
    await db.doc("artists/artist_d").set({ name: "Cobalt", normalizedName: "cobalt", tagIds: [], status: "active" }); // same name: id breaks the tie
    await db.doc("songs/s_a").set(songDoc("Apple", { popularityRank: 7 }));
    await db.doc("songs/s_b").set(songDoc("Banana", { tagIds: ["mood_chill"], artistIds: ["artist_b"], artistNames: ["Beta"] }));
    await db.doc("songs/s_c").set(songDoc("Cherry"));
    await db.doc("songs/s_hidden").set(songDoc("Hidden", { status: "unavailable" }));
    await db.doc("songs/s_dup1").set(songDoc("Same")); // identical sort key: id is the tie-breaker
    await db.doc("songs/s_dup2").set(songDoc("Same"));
  });

  it("returns only active tags", async () => {
    const tags = await repo.listTags();
    expect(tags.map((t) => t.id)).toEqual(["genre_pop"]);
  });

  it("pages deterministically (including identical titles) and hides inactive songs", async () => {
    const seen: string[] = [];
    let after;
    for (let guard = 0; guard < 10; guard++) {
      const page = await repo.listSongs({ limit: 2, after });
      seen.push(...page.items.map((s) => s.id));
      after = page.next ?? undefined;
      if (!after) break;
    }
    expect(seen).toEqual(["s_a", "s_b", "s_c", "s_dup1", "s_dup2"]);
    expect(seen).not.toContain("s_hidden");
  });

  it("filters by tag and by artist", async () => {
    expect((await repo.listSongs({ limit: 10, tagId: "mood_chill" })).items.map((s) => s.id)).toEqual(["s_b"]);
    expect((await repo.listSongs({ limit: 10, artistId: "artist_b" })).items.map((s) => s.id)).toEqual(["s_b"]);
  });

  it("returns null for inactive or missing songs and artists", async () => {
    expect(await repo.getSong("s_hidden")).toBeNull();
    expect(await repo.getSong("nope")).toBeNull();
    expect(await repo.getArtist("artist_gone")).toBeNull();
    expect((await repo.getSong("s_a"))?.popularityRank).toBe(7);
  });

  it("serves the full API from Firestore without leaking storage paths", async () => {
    const app = createApp({
      social: {} as never,
      recommendations: {} as never,
      verifier: { verify: async () => ({ uid: "alice" }) },
      identity: {} as IdentityServices, // not used by catalog routes
      library: {} as LibraryService,
      catalog: new CatalogService(repo, { now: () => new Date() }),
    });
    const res = await request(app).get("/v1/catalog/songs?limit=3").set("Authorization", "Bearer x");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.nextCursor).toBeTypeOf("string");
    expect(JSON.stringify(res.body)).not.toMatch(/storagePath|secret|rights/);

    const search = await request(app).get("/v1/search?q=apple").set("Authorization", "Bearer x");
    expect(search.body.songs.map((s: { id: string }) => s.id)).toEqual(["s_a"]);
  });

  // ---- HTTP behavior, exercised against real Firestore data ----
  const AUTH = { Authorization: "Bearer t" };
  const makeApp = () =>
    createApp({
      social: {} as never,
      recommendations: {} as never,
      verifier: { verify: async (t: string) => (t === "t" ? { uid: "alice" } : Promise.reject(new Error("bad"))) },
      identity: {} as IdentityServices, // not used by catalog routes
      library: {} as LibraryService,
      catalog: new CatalogService(repo, { now: () => new Date() }),
    });
  const ids = (items: { id: string }[]) => items.map((i) => i.id);

  it("requires authentication on every catalog route", async () => {
    const app = makeApp();
    for (const path of ["/v1/catalog/tags", "/v1/catalog/songs", "/v1/catalog/songs/s_a", "/v1/catalog/artists", "/v1/artists/artist_a", "/v1/search?q=a"]) {
      expect((await request(app).get(path)).status).toBe(401);
    }
  });

  it("lists tags (active only), filters by category, and rejects unknown categories", async () => {
    const app = makeApp();
    const all = await request(app).get("/v1/catalog/tags").set(AUTH);
    expect(ids(all.body.items)).toEqual(["genre_pop"]);
    expect(all.headers["cache-control"]).toContain("max-age");
    expect(ids((await request(app).get("/v1/catalog/tags?category=mood").set(AUTH)).body.items)).toEqual([]);
    expect((await request(app).get("/v1/catalog/tags?category=era").set(AUTH)).status).toBe(400);
  });

  it("rejects tagId and artistId together, and invalid limit, cursor or ids", async () => {
    const app = makeApp();
    for (const q of ["tagId=genre_pop&artistId=artist_a", "limit=0", "limit=51", "limit=abc", "cursor=%%%", "cursor=bm90LWpzb24", "tagId=a%2Fb", "artistId=a b"]) {
      const res = await request(app).get(`/v1/catalog/songs?${q}`).set(AUTH);
      expect(res.status, q).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns a song, 404 for missing or inactive ones, and 400 for a malformed id", async () => {
    const app = makeApp();
    const ok = await request(app).get("/v1/catalog/songs/s_a").set(AUTH);
    expect(ok.status).toBe(200);
    expect(ok.body.song.title).toBe("Apple");
    expect(ok.body.song.peakStartMs).toBe(60000);
    expect((await request(app).get("/v1/catalog/songs/s_hidden").set(AUTH)).status).toBe(404);
    expect((await request(app).get("/v1/catalog/songs/nope").set(AUTH)).status).toBe(404);
    expect((await request(app).get("/v1/catalog/songs/a%2Fb").set(AUTH)).status).toBe(400);
  });

  it("returns an artist with their songs, and 404 for unknown or archived artists", async () => {
    const app = makeApp();
    const res = await request(app).get("/v1/artists/artist_a").set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.artist.name).toBe("Alpha Band");
    expect(ids(res.body.songs)).toEqual(["s_a", "s_c", "s_dup1", "s_dup2"]);
    expect((await request(app).get("/v1/artists/artist_gone").set(AUTH)).status).toBe(404);
    expect((await request(app).get("/v1/artists/none").set(AUTH)).status).toBe(404);
  });

  it("searches case-insensitively, ranks prefix matches first, and rejects empty queries", async () => {
    const app = makeApp();
    const res = await request(app).get("/v1/search?q=%20ALPHA%20").set(AUTH);
    expect(res.status).toBe(200);
    // Artist "Alpha Band" matches by prefix, so all of its active songs and the artist come back.
    expect(ids(res.body.artists)).toEqual(["artist_a"]);
    expect(ids(res.body.songs)).toEqual(expect.arrayContaining(["s_a", "s_c"]));
    expect(ids(res.body.songs)).not.toContain("s_hidden");
    expect((await request(app).get("/v1/search?q=").set(AUTH)).status).toBe(400);
    expect((await request(app).get("/v1/search").set(AUTH)).status).toBe(400);
  });

  it("caches the search catalog, so repeated searches read Firestore once", async () => {
    const spy = vi.spyOn(repo, "listActiveForSearch");
    const app = makeApp();
    await request(app).get("/v1/search?q=apple").set(AUTH);
    await request(app).get("/v1/search?q=banana").set(AUTH);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  // ---- Browse artists (e.g. onboarding S08) ----

  it("pages artists A-Z deterministically (identical names tie-broken by id), hiding archived ones", async () => {
    const app = makeApp();
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let guard = 0; guard < 10; guard++) {
      const res = await request(app).get(`/v1/catalog/artists?limit=2${cursor ? `&cursor=${cursor}` : ""}`).set(AUTH);
      expect(res.status).toBe(200);
      seen.push(...ids(res.body.items));
      cursor = res.body.nextCursor;
      if (!cursor) break;
    }
    expect(seen).toEqual(["artist_a", "artist_b", "artist_c", "artist_d"]);
    expect(seen).not.toContain("artist_gone");
  });

  it("filters artists by tag and returns only public fields", async () => {
    const app = makeApp();
    const res = await request(app).get("/v1/catalog/artists?tagId=genre_pop").set(AUTH);
    expect(ids(res.body.items)).toEqual(["artist_b", "artist_c"]);
    expect(res.body.items[0]).toEqual({
      id: "artist_b",
      name: "Beta Trio",
      imagePath: "catalog/artists/artist_b/v1.jpg",
      tagIds: ["genre_pop"],
    });
    expect(ids((await request(app).get("/v1/catalog/artists?tagId=nope").set(AUTH)).body.items)).toEqual([]);
  });

  it("validates artist list parameters", async () => {
    const app = makeApp();
    for (const q of ["limit=0", "limit=51", "limit=abc", "cursor=%%%", "cursor=bm90LWpzb24", "tagId=a%2Fb"]) {
      const res = await request(app).get(`/v1/catalog/artists?${q}`).set(AUTH);
      expect(res.status, q).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
