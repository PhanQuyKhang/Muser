import { initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../../bootstrap/app";
import { CatalogService } from "../../catalog/application/catalog.service";
import { FirestoreCatalogRepository } from "../../catalog/infrastructure/firestore-catalog.repository";
import type { IdentityServices } from "../../identity/identity.services";
import { LibraryService } from "../application/library.service";
import {
  FirestoreLibraryQueries,
  FirestoreLibraryUnitOfWork,
  FirestorePlaylistCleanup,
} from "./firestore-library";

// Real Firestore transactions against the Firestore EMULATOR (run via `npm test`).
// NOTE: the emulator does not enforce composite indexes; the playlist list query still
// needs the (ownerId, status, updatedAt) index from firebase/firestore.indexes.json.
const host = process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!host)("library against the Firestore emulator", () => {
  let db: Firestore;
  let app: ReturnType<typeof createApp>;
  let now = new Date("2026-01-01T00:00:00.000Z");
  let idCounter = 0;

  const advance = (ms = 1000) => {
    now = new Date(now.getTime() + ms);
  };

  beforeAll(() => {
    initializeApp({ projectId: "demo-muser" });
    db = getFirestore();
    const clock = { now: () => now };
    const catalog = new CatalogService(new FirestoreCatalogRepository(db), clock);
    const library = new LibraryService({
      uow: new FirestoreLibraryUnitOfWork(db),
      queries: new FirestoreLibraryQueries(db),
      cleanup: new FirestorePlaylistCleanup(db),
      songs: { getSong: (id) => catalog.getSong(id), getSongsByIds: (ids) => catalog.getSongsByIds(ids) },
      clock,
      newId: () => `pl_${++idCounter}`,
    });
    app = createApp({
      social: {} as never,
      recommendations: {} as never, media: {} as never,
      verifier: { verify: async (t) => (t.startsWith("t-") ? { uid: t.slice(2) } : Promise.reject(new Error("bad"))) },
      identity: {} as IdentityServices, // not used by library routes
      catalog,
      library,
    });
  });

  const songDoc = (title: string, status = "active") => ({
    title,
    normalizedTitle: title.toLowerCase(),
    artistIds: ["artist_a"],
    artistNames: ["Alpha"],
    albumId: null,
    coverPath: null,
    durationMs: 200000,
    peakStartMs: 60000,
    tagIds: [],
    explicit: false,
    status,
    audio: { storagePath: "catalog/audio/secret/v1.mp3" },
  });

  beforeEach(async () => {
    await fetch(`http://${host}/emulator/v1/projects/demo-muser/databases/(default)/documents`, { method: "DELETE" });
    now = new Date("2026-01-01T00:00:00.000Z");
    idCounter = 0;
    for (const n of [1, 2, 3, 4, 5]) await db.doc(`songs/s${n}`).set(songDoc(`Song ${n}`));
    await db.doc("songs/s_gone").set(songDoc("Gone", "unavailable"));
  });

  const auth = (uid: string) => ({ Authorization: `Bearer t-${uid}` });
  // Passing `undefined` explicitly means "send no body"; omitting the argument sends the default.
  const like = (uid: string, songId: string, ...rest: [unknown?]) =>
    request(app)
      .put(`/v1/me/likes/${songId}`)
      .set(auth(uid))
      .send((rest.length ? rest[0] : { source: "my_explore" }) as object);
  const unlike = (uid: string, songId: string) => request(app).delete(`/v1/me/likes/${songId}`).set(auth(uid));
  const likes = (uid: string, q = "") => request(app).get(`/v1/me/likes${q}`).set(auth(uid));
  const newPlaylist = (uid: string, ...rest: [unknown?]) =>
    request(app)
      .post("/v1/playlists")
      .set(auth(uid))
      .send((rest.length ? rest[0] : { name: "Road trip" }) as object);
  const addSong = (uid: string, pl: string, songId: string) =>
    request(app).put(`/v1/playlists/${pl}/items/${songId}`).set(auth(uid));
  const removeSong = (uid: string, pl: string, songId: string) =>
    request(app).delete(`/v1/playlists/${pl}/items/${songId}`).set(auth(uid));
  const items = (uid: string, pl: string, q = "") => request(app).get(`/v1/playlists/${pl}/items${q}`).set(auth(uid));
  const exists = async (path: string) => (await db.doc(path).get()).exists;
  const songIds = (list: { songId: string }[]) => list.map((i) => i.songId);

  it("requires authentication on every library route", async () => {
    for (const [method, path] of [
      ["get", "/v1/me/likes"],
      ["put", "/v1/me/likes/s1"],
      ["delete", "/v1/me/likes/s1"],
      ["post", "/v1/playlists"],
      ["get", "/v1/playlists"],
      ["get", "/v1/playlists/pl_1"],
      ["patch", "/v1/playlists/pl_1"],
      ["delete", "/v1/playlists/pl_1"],
      ["get", "/v1/playlists/pl_1/items"],
      ["put", "/v1/playlists/pl_1/items/s1"],
      ["delete", "/v1/playlists/pl_1/items/s1"],
    ] as const) {
      expect((await request(app)[method](path)).status, `${method} ${path}`).toBe(401);
    }
  });

  describe("Liked", () => {
    it("saves a song once and a replay changes nothing", async () => {
      const first = await like("alice", "s1", { source: "search" });
      expect(first.status).toBe(201);
      expect(first.body).toMatchObject({ songId: "s1", source: "search", likedAt: "2026-01-01T00:00:00.000Z" });
      const doc = await db.doc("users/alice/likes/s1").get();
      expect(doc.data()).toMatchObject({ songId: "s1", source: "search", sourceShareId: null, activeShareId: null });

      advance();
      const again = await like("alice", "s1", { source: "playlist" });
      expect(again.status).toBe(200);
      expect(again.body.likedAt).toBe("2026-01-01T00:00:00.000Z"); // likedAt not refreshed
      expect(again.body.source).toBe("search"); // original source kept
      const after = await db.doc("users/alice/likes/s1").get();
      expect(after.updateTime!.isEqual(doc.updateTime!)).toBe(true);
    });

    it("rejects unknown or unavailable songs without writing", async () => {
      expect((await like("alice", "nope")).status).toBe(404);
      expect((await like("alice", "s_gone")).status).toBe(404);
      expect(await exists("users/alice/likes/nope")).toBe(false);
      expect(await exists("users/alice/likes/s_gone")).toBe(false);
    });

    it("validates the body and ids", async () => {
      const bad: Record<string, unknown> = {
        "no body": undefined,
        "bad source": { source: "radio" },
        "missing source": {},
        "share id outside friends": { source: "search", sourceShareId: "sh_1" },
        "unknown field": { source: "search", likedAt: "2020-01-01" },
        "unknown activeShareId": { source: "search", activeShareId: "x" },
      };
      for (const [name, body] of Object.entries(bad)) {
        const res = await like("alice", "s1", body);
        expect(res.status, name).toBe(400);
      }
      expect((await like("alice", "a%2Fb")).status).toBe(400);
      expect(await exists("users/alice/likes/s1")).toBe(false);
      // A friend like may carry the share it came from.
      const ok = await like("alice", "s1", { source: "friends", sourceShareId: "sh_1" });
      expect(ok.status).toBe(201);
      expect((await db.doc("users/alice/likes/s1").get()).get("sourceShareId")).toBe("sh_1");
    });

    it("unlike removes the like, is idempotent, and keeps playlist memberships", async () => {
      await like("alice", "s1");
      const pl = (await newPlaylist("alice")).body.playlist.id;
      await addSong("alice", pl, "s1");

      expect((await unlike("alice", "s1")).status).toBe(204);
      expect(await exists("users/alice/likes/s1")).toBe(false);
      expect((await unlike("alice", "s1")).status).toBe(204); // already gone
      expect((await unlike("alice", "s2")).status).toBe(204); // never liked
      expect(await exists(`playlists/${pl}/items/s1`)).toBe(true); // membership untouched
    });

    it("lists likes newest or oldest first, paged without gaps or duplicates (ties broken by id)", async () => {
      await like("alice", "s1");
      advance();
      await like("alice", "s2");
      advance(0); // same timestamp: ordering must still be deterministic
      await like("alice", "s3");
      advance();
      await like("alice", "s4");

      const collect = async (sort: string) => {
        const seen: string[] = [];
        let cursor: string | null = null;
        for (let guard = 0; guard < 10; guard++) {
          const res = await likes("alice", `?sort=${sort}&limit=2${cursor ? `&cursor=${cursor}` : ""}`);
          expect(res.status).toBe(200);
          seen.push(...songIds(res.body.items));
          cursor = res.body.nextCursor;
          if (!cursor) break;
        }
        return seen;
      };
      expect(await collect("newest")).toEqual(["s4", "s3", "s2", "s1"]);
      expect(await collect("oldest")).toEqual(["s1", "s2", "s3", "s4"]);
    });

    it("hydrates songs without leaking storage paths, and keeps likes of songs that became unavailable", async () => {
      await like("alice", "s1");
      advance();
      await like("alice", "s2");
      await db.doc("songs/s1").update({ status: "unavailable" });

      const res = await likes("alice");
      expect(res.body.items.map((i: { songId: string }) => i.songId)).toEqual(["s2", "s1"]);
      expect(res.body.items[0].song.title).toBe("Song 2");
      expect(res.body.items[1].song).toBeNull(); // kept, shown as unavailable
      expect(JSON.stringify(res.body)).not.toMatch(/storagePath|secret|audio/);
    });

    it("validates list parameters and keeps users separate", async () => {
      for (const q of ["?limit=0", "?limit=51", "?sort=random", "?cursor=%%%", "?cursor=bm90LWpzb24"]) {
        expect((await likes("alice", q)).status, q).toBe(400);
      }
      await like("alice", "s1");
      expect((await likes("bob")).body.items).toEqual([]);
      expect(songIds((await likes("alice")).body.items)).toEqual(["s1"]);
    });
  });

  describe("Playlists", () => {
    it("creates a playlist with a random id owned by the caller", async () => {
      const res = await newPlaylist("alice", { name: "  Road trip " });
      expect(res.status).toBe(201);
      expect(res.body.playlist).toMatchObject({ id: "pl_1", name: "Road trip", coverPath: null });
      expect((await db.doc("playlists/pl_1").get()).data()).toMatchObject({
        ownerId: "alice",
        name: "Road trip",
        description: null,
        status: "active",
      });
    });

    it("validates names and rejects unknown fields", async () => {
      const bad: Record<string, unknown> = {
        "no body": undefined,
        empty: { name: "  " },
        long: { name: "x".repeat(61) },
        "control char": { name: "bad\u0007name" },
        "unknown ownerId": { name: "ok", ownerId: "mallory" },
        "description is post-MVP": { name: "ok", description: "x" },
      };
      for (const [name, body] of Object.entries(bad)) {
        expect((await newPlaylist("alice", body)).status, name).toBe(400);
      }
      expect(await exists("playlists/pl_1")).toBe(false);
    });

    it("lists only the caller's active playlists, most recently updated first, paged", async () => {
      await newPlaylist("alice", { name: "A" }); // pl_1
      advance();
      await newPlaylist("alice", { name: "B" }); // pl_2
      advance();
      await newPlaylist("bob", { name: "Bob's" }); // pl_3
      advance();
      await newPlaylist("alice", { name: "C" }); // pl_4
      await db.doc("playlists/pl_hidden").set({ ownerId: "alice", name: "Hidden", status: "deleting", coverPath: null, createdAt: new Date(), updatedAt: new Date() });

      const seen: string[] = [];
      let cursor: string | null = null;
      for (let guard = 0; guard < 10; guard++) {
        const res = await request(app).get(`/v1/playlists?limit=2${cursor ? `&cursor=${cursor}` : ""}`).set(auth("alice"));
        expect(res.status).toBe(200);
        seen.push(...res.body.items.map((p: { name: string }) => p.name));
        cursor = res.body.nextCursor;
        if (!cursor) break;
      }
      expect(seen).toEqual(["C", "B", "A"]);
    });

    it("hides other users' playlists with a 404 (existence is not revealed)", async () => {
      await newPlaylist("alice");
      for (const res of [
        await request(app).get("/v1/playlists/pl_1").set(auth("bob")),
        await request(app).patch("/v1/playlists/pl_1").set(auth("bob")).send({ name: "Mine now" }),
        await items("bob", "pl_1"),
        await addSong("bob", "pl_1", "s1"),
        await removeSong("bob", "pl_1", "s1"),
        await request(app).get("/v1/playlists/missing").set(auth("alice")),
      ]) {
        expect(res.status).toBe(404);
      }
      expect(await exists("playlists/pl_1/items/s1")).toBe(false);
      expect((await db.doc("playlists/pl_1").get()).get("name")).toBe("Road trip");
    });

    it("renames, bumps updatedAt, and moves the playlist to the top of the list", async () => {
      await newPlaylist("alice", { name: "Old" }); // pl_1
      advance();
      await newPlaylist("alice", { name: "Newer" }); // pl_2
      advance();
      const res = await request(app).patch("/v1/playlists/pl_1").set(auth("alice")).send({ name: "Renamed" });
      expect(res.status).toBe(200);
      expect(res.body.playlist.name).toBe("Renamed");
      expect(res.body.playlist.updatedAt).toBe("2026-01-01T00:00:02.000Z");

      const list = await request(app).get("/v1/playlists").set(auth("alice"));
      expect(list.body.items.map((p: { name: string }) => p.name)).toEqual(["Renamed", "Newer"]);
      expect((await request(app).patch("/v1/playlists/pl_1").set(auth("alice")).send({ name: "" })).status).toBe(400);
    });

    it("adds a song once; a replay changes nothing; unknown songs are rejected", async () => {
      await newPlaylist("alice");
      const first = await addSong("alice", "pl_1", "s1");
      expect(first.status).toBe(201);
      expect((await db.doc("playlists/pl_1/items/s1").get()).data()).toMatchObject({ songId: "s1" });

      advance();
      const again = await addSong("alice", "pl_1", "s1");
      expect(again.status).toBe(200);
      expect(again.body.addedAt).toBe(first.body.addedAt); // not refreshed

      expect((await addSong("alice", "pl_1", "nope")).status).toBe(404);
      expect((await addSong("alice", "pl_1", "s_gone")).status).toBe(404);
      expect((await addSong("alice", "pl_1", "a%2Fb")).status).toBe(400);
    });

    it("lets one song live in Liked and several playlists at once, independently", async () => {
      await newPlaylist("alice", { name: "One" }); // pl_1
      await newPlaylist("alice", { name: "Two" }); // pl_2
      await like("alice", "s1");
      await addSong("alice", "pl_1", "s1");
      await addSong("alice", "pl_2", "s1");

      await removeSong("alice", "pl_1", "s1");
      expect(await exists("playlists/pl_1/items/s1")).toBe(false);
      expect(await exists("playlists/pl_2/items/s1")).toBe(true);
      expect(await exists("users/alice/likes/s1")).toBe(true); // removing a membership never unlikes
    });

    it("lists items newest or oldest first, paged, with song data", async () => {
      await newPlaylist("alice");
      for (const s of ["s1", "s2", "s3"]) {
        await addSong("alice", "pl_1", s);
        advance();
      }
      const newest = await items("alice", "pl_1", "?limit=2");
      expect(songIds(newest.body.items)).toEqual(["s3", "s2"]);
      expect(newest.body.items[0].song.title).toBe("Song 3");
      const rest = await items("alice", "pl_1", `?limit=2&cursor=${newest.body.nextCursor}`);
      expect(songIds(rest.body.items)).toEqual(["s1"]);
      expect(rest.body.nextCursor).toBeNull();
      expect(songIds((await items("alice", "pl_1", "?sort=oldest")).body.items)).toEqual(["s1", "s2", "s3"]);
    });

    it("removing a song is idempotent", async () => {
      await newPlaylist("alice");
      await addSong("alice", "pl_1", "s1");
      expect((await removeSong("alice", "pl_1", "s1")).status).toBe(204);
      expect((await removeSong("alice", "pl_1", "s1")).status).toBe(204);
      expect((await removeSong("alice", "pl_1", "s5")).status).toBe(204);
    });

    it("deletes the playlist and ALL its items, even more than one batch", async () => {
      await newPlaylist("alice");
      const batch = db.batch();
      for (let i = 0; i < 450; i++) {
        batch.set(db.doc(`playlists/pl_1/items/bulk_${i}`), { songId: `bulk_${i}`, addedAt: new Date(), position: i });
      }
      await batch.commit();

      expect((await request(app).delete("/v1/playlists/pl_1").set(auth("alice"))).status).toBe(204);
      expect(await exists("playlists/pl_1")).toBe(false);
      expect((await db.collection("playlists/pl_1/items").limit(1).get()).empty).toBe(true);
      expect((await request(app).delete("/v1/playlists/pl_1").set(auth("alice"))).status).toBe(204); // idempotent
    });

    it("never deletes someone else's playlist", async () => {
      await newPlaylist("alice");
      await addSong("alice", "pl_1", "s1");
      expect((await request(app).delete("/v1/playlists/pl_1").set(auth("bob"))).status).toBe(204); // no-op
      expect(await exists("playlists/pl_1")).toBe(true);
      expect(await exists("playlists/pl_1/items/s1")).toBe(true);
    });

    it("finishes an interrupted delete, and a deleting playlist is hidden and read-only", async () => {
      await newPlaylist("alice");
      await addSong("alice", "pl_1", "s1");
      await db.doc("playlists/pl_1").update({ status: "deleting" }); // simulate a crash after marking

      expect((await request(app).get("/v1/playlists/pl_1").set(auth("alice"))).status).toBe(404);
      expect((await request(app).get("/v1/playlists").set(auth("alice"))).body.items).toEqual([]);
      expect((await addSong("alice", "pl_1", "s2")).status).toBe(404);
      expect(await exists("playlists/pl_1/items/s2")).toBe(false);

      expect((await request(app).delete("/v1/playlists/pl_1").set(auth("alice"))).status).toBe(204); // retry completes it
      expect(await exists("playlists/pl_1")).toBe(false);
      expect(await exists("playlists/pl_1/items/s1")).toBe(false);
    });

    it("deleting a playlist leaves likes untouched", async () => {
      await newPlaylist("alice");
      await like("alice", "s1");
      await addSong("alice", "pl_1", "s1");
      await request(app).delete("/v1/playlists/pl_1").set(auth("alice"));
      expect(await exists("users/alice/likes/s1")).toBe(true);
    });
  });
});
