import { randomUUID } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../../bootstrap/app";
import { CatalogService } from "../../catalog/application/catalog.service";
import { FirestoreCatalogRepository } from "../../catalog/infrastructure/firestore-catalog.repository";
import type { IdentityServices } from "../../identity/identity.services";
import { LibraryService } from "../../library/application/library.service";
import {
  FirestoreLibraryQueries,
  FirestoreLibraryUnitOfWork,
  FirestorePlaylistCleanup,
} from "../../library/infrastructure/firestore-library";
import { RecommendationService } from "../../recommendation/application/recommendation.service";
import { FirestoreTasteRepository } from "../../recommendation/infrastructure/firestore-taste";
import { SocialService } from "../application/social.service";
import { FirestoreSocialQueries, FirestoreSocialUnitOfWork } from "./firestore-social";

// Friends, sharing, hearts and recommendations against the Firestore EMULATOR.
const host = process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!host)("social against the Firestore emulator", () => {
  let db: Firestore;
  let app: ReturnType<typeof createApp>;
  let now = new Date("2026-01-01T00:00:00.000Z");

  beforeAll(() => {
    initializeApp({ projectId: "demo-muser" });
    db = getFirestore();
    // Each call moves time forward, so newest-first ordering is deterministic.
    const clock = { now: () => (now = new Date(now.getTime() + 1000)) };
    const catalog = new CatalogService(new FirestoreCatalogRepository(db), clock);
    const songs = {
      getSong: (id: string) => catalog.getSong(id),
      getSongsByIds: (ids: string[]) => catalog.getSongsByIds(ids),
    };
    app = createApp({
      verifier: {
        verify: async (t) =>
          t.startsWith("t-") ? { uid: t.slice(2) } : Promise.reject(new Error("bad")),
      },
      identity: {} as IdentityServices,
      catalog,
      library: new LibraryService({
        uow: new FirestoreLibraryUnitOfWork(db),
        queries: new FirestoreLibraryQueries(db),
        cleanup: new FirestorePlaylistCleanup(db),
        songs,
        clock,
        newId: () => randomUUID(),
      }),
      social: new SocialService({
        uow: new FirestoreSocialUnitOfWork(db),
        queries: new FirestoreSocialQueries(db),
        songs,
        clock,
      }),
      recommendations: new RecommendationService({
        tastes: new FirestoreTasteRepository(db),
        catalog: { listActive: () => catalog.listActive() },
      }),
    });
  });

  beforeEach(async () => {
    await fetch(`http://${host}/emulator/v1/projects/demo-muser/databases/(default)/documents`, {
      method: "DELETE",
    });
    for (const uid of ["alice", "bob", "carol"]) {
      await db.doc(`profiles/${uid}`).set({ username: uid, displayName: uid.toUpperCase() });
      await db.doc(`usernames/${uid}`).set({ uid });
      await db.doc(`users/${uid}`).set({ sharingEnabled: true, shareEpoch: 0 });
    }
    for (const n of [1, 2, 3]) {
      await db.doc(`songs/s${n}`).set({
        title: `Song ${n}`,
        normalizedTitle: `song ${n}`,
        artistIds: ["artist_a"],
        artistNames: ["Alpha"],
        tagIds: [n === 1 ? "genre_pop" : "genre_rock"],
        durationMs: 200000,
        peakStartMs: 60000,
        explicit: false,
        status: "active",
      });
    }
  });

  const as = (uid: string) => ({ Authorization: `Bearer t-${uid}` });
  const get = (uid: string, path: string) => request(app).get(`/v1${path}`).set(as(uid));
  const post = (uid: string, path: string, body: object) =>
    request(app).post(`/v1${path}`).set(as(uid)).send(body);
  const like = (uid: string, songId: string) =>
    request(app).put(`/v1/me/likes/${songId}`).set(as(uid)).send({ source: "my_explore" });
  const unlike = (uid: string, songId: string) =>
    request(app).delete(`/v1/me/likes/${songId}`).set(as(uid));
  const sharing = (uid: string, enabled: boolean) =>
    request(app).patch("/v1/me/sharing").set(as(uid)).send({ enabled });
  const feed = async (uid: string) => (await get(uid, "/friends/discoveries")).body.items;

  async function befriend(a: string, b: string): Promise<string> {
    const sent = await post(a, "/friend-requests", { username: b });
    await post(b, `/friend-requests/${sent.body.pairId}/respond`, { action: "accept" });
    return sent.body.pairId;
  }

  describe("friend requests", () => {
    it("goes from search to request to friends", async () => {
      const found = await get("alice", "/users/search?username=Bob");
      expect(found.body.user).toMatchObject({ relationship: "none", profile: { uid: "bob" } });

      const sent = await post("alice", "/friend-requests", { username: "bob" });
      expect(sent.status).toBe(201);
      expect((await get("bob", "/friend-requests")).body.incoming).toHaveLength(1);
      expect((await get("alice", "/friend-requests")).body.outgoing).toHaveLength(1);

      const opposite = await post("bob", "/friend-requests", { username: "alice" });
      expect(opposite.status).toBe(409);
      expect(opposite.body.error.details).toEqual({ reason: "EXISTING_INCOMING_REQUEST" });

      const accept = { action: "accept" };
      const path = `/friend-requests/${sent.body.pairId}/respond`;
      expect((await post("alice", path, accept)).status).toBe(403);
      expect((await post("carol", path, accept)).status).toBe(404);
      expect((await post("bob", path, accept)).body.status).toBe("accepted");
      expect((await get("alice", "/friends")).body.items[0].profile.username).toBe("bob");
    });

    it("rejects self requests and unknown users", async () => {
      expect((await post("alice", "/friend-requests", { username: "alice" })).status).toBe(400);
      expect((await post("alice", "/friend-requests", { username: "nobody" })).status).toBe(404);
      expect((await get("alice", "/users/search?username=nobody")).body.user).toBeNull();
    });
  });

  describe("sharing", () => {
    it("shares a new like with accepted friends only, and unlike withdraws it", async () => {
      await befriend("alice", "bob");
      await like("alice", "s1");

      const items = await feed("bob");
      expect(items).toHaveLength(1);
      expect(items[0].song.id).toBe("s1");
      expect(items[0].sharers[0]).toMatchObject({ uid: "alice", heartSent: false });
      expect(await feed("carol")).toEqual([]);

      await unlike("alice", "s1");
      expect(await feed("bob")).toEqual([]);
    });

    it("keeps a like private while sharing is off, and old shares never come back", async () => {
      await befriend("alice", "bob");
      await like("alice", "s1");

      expect((await sharing("alice", false)).body).toMatchObject({ enabled: false, epoch: 1 });
      await like("alice", "s2");
      expect(await feed("bob")).toEqual([]);

      expect((await sharing("alice", true)).body).toMatchObject({ enabled: true, epoch: 1 });
      expect(await feed("bob")).toEqual([]);

      await like("alice", "s3");
      expect((await feed("bob")).map((i: { song: { id: string } }) => i.song.id)).toEqual(["s3"]);
    });

    it("stops showing songs after a friend is removed", async () => {
      const pair = await befriend("alice", "bob");
      await like("alice", "s1");
      const removed = await request(app).delete(`/v1/friendships/${pair}`).set(as("bob"));
      expect(removed.status).toBe(204);
      expect(await feed("bob")).toEqual([]);
    });
  });

  describe("hearts", () => {
    it("sends one heart, records Activity and never likes the song", async () => {
      await befriend("alice", "bob");
      await like("alice", "s1");
      const shareId = (await feed("bob"))[0].sharers[0].shareId;
      const path = `/shares/${shareId}/hearts`;

      expect((await post("bob", path, { requestId: "r1" })).status).toBe(201);
      expect((await post("bob", path, { requestId: "r1" })).status).toBe(201); // retry
      expect((await post("bob", path, { requestId: "r2" })).status).toBe(409);
      expect((await post("alice", path, { requestId: "r3" })).status).toBe(400);
      expect((await post("carol", path, { requestId: "r4" })).status).toBe(404);
      expect((await get("bob", "/me/likes")).body.items).toEqual([]);
      expect((await feed("bob"))[0].sharers[0].heartSent).toBe(true);

      const activity = (await get("alice", "/me/activity")).body.items;
      expect(activity).toHaveLength(1);
      expect(activity[0]).toMatchObject({ actor: { uid: "bob" }, song: { id: "s1" } });

      await unlike("alice", "s1");
      expect((await get("alice", "/me/activity")).body.items[0].song).toBeNull();
    });
  });

  describe("recommendations", () => {
    it("ranks by taste, leaves out liked songs and remembers the level", async () => {
      await db.doc("users/alice").set({ seedTagIds: ["genre_pop"] }, { merge: true });

      const familiar = await get("alice", "/recommendations?level=familiar&limit=2");
      expect(familiar.body.songIds[0]).toBe("s1");
      expect(familiar.body.nextCursor).toEqual(expect.any(String));
      expect((await db.doc("users/alice").get()).get("discoveryLevel")).toBe("familiar");

      const surprise = await get("alice", "/recommendations?level=surprise");
      expect(surprise.body.songIds[0]).not.toBe("s1");

      await like("alice", "s1");
      expect((await get("alice", "/recommendations")).body.songIds).not.toContain("s1");
    });
  });
});
