import { initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../../bootstrap/app";
import { CatalogService } from "../../catalog/application/catalog.service";
import { FirestoreCatalogRepository } from "../../catalog/infrastructure/firestore-catalog.repository";
import { CheckUsernameUseCase } from "../application/check-username.use-case";
import { CompleteOnboardingUseCase } from "../application/complete-onboarding.use-case";
import { CreateProfileUseCase } from "../application/create-profile.use-case";
import { GetMeUseCase } from "../application/get-me.use-case";
import { FirestoreIdentityQueries, FirestoreIdentityUnitOfWork } from "./firestore-identity";

// Real Firestore transactions against the Firestore EMULATOR (run via `npm test`).
// Flow under test: S05 POST /v1/me/profile  ->  S06-S09 POST /v1/onboarding.
const host = process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!host)("profile + onboarding against the Firestore emulator", () => {
  let db: Firestore;
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    initializeApp({ projectId: "demo-muser" });
    db = getFirestore();
    const catalog = new CatalogService(new FirestoreCatalogRepository(db), { now: () => new Date() });
    const uow = new FirestoreIdentityUnitOfWork(db);
    const queries = new FirestoreIdentityQueries(db);
    app = createApp({
      // Test tokens look like "t-<uid>"; the real verifier is covered by the auth tests.
      verifier: { verify: async (t) => (t.startsWith("t-") ? { uid: t.slice(2) } : Promise.reject(new Error("bad"))) },
      catalog,
      identity: {
        createProfile: new CreateProfileUseCase(uow),
        completeOnboarding: new CompleteOnboardingUseCase(uow, { findMissing: (r) => catalog.findMissingReferences(r) }),
        checkUsername: new CheckUsernameUseCase(queries),
        getMe: new GetMeUseCase(queries),
      },
    });
  });

  beforeEach(async () => {
    await fetch(`http://${host}/emulator/v1/projects/demo-muser/databases/(default)/documents`, { method: "DELETE" });
    await db.doc("tags/genre_pop").set({ label: "Pop", category: "genre", status: "active" });
    await db.doc("tags/mood_chill").set({ label: "Chill", category: "mood", status: "active" });
    await db.doc("tags/genre_old").set({ label: "Old", category: "genre", status: "archived" });
    for (const id of ["s1", "s2", "s3", "s4", "s5", "s6"]) await db.doc(`songs/${id}`).set({ status: "active" });
    await db.doc("songs/s_gone").set({ status: "unavailable" });
    await db.doc("artists/a1").set({ status: "active" });
  });

  const auth = (uid: string) => ({ Authorization: `Bearer t-${uid}` });
  const profile = (uid: string, body?: unknown) =>
    request(app).post("/v1/me/profile").set(auth(uid)).send(body as object);
  const onboard = (uid: string, body?: unknown) =>
    request(app).post("/v1/onboarding").set(auth(uid)).send(body as object);
  const me = (uid: string) => request(app).get("/v1/me").set(auth(uid));
  const available = (uid: string, name: string) =>
    request(app).get(`/v1/usernames/${encodeURIComponent(name)}/available`).set(auth(uid));
  const valid = { username: "vy_test", displayName: "Vy" };
  const exists = async (path: string) => (await db.doc(path).get()).exists;

  it("requires authentication on every identity route", async () => {
    expect((await request(app).post("/v1/me/profile").send(valid)).status).toBe(401);
    expect((await request(app).post("/v1/onboarding").send({})).status).toBe(401);
    expect((await request(app).get("/v1/usernames/abc/available")).status).toBe(401);
  });

  describe("S05: create profile", () => {
    it("reserves the username and creates the profile together, without touching settings", async () => {
      const res = await profile("alice", { username: "  Vy_Test ", displayName: " Vy " });
      expect(res.status).toBe(201);
      expect(res.body.profile).toEqual({ username: "vy_test", displayName: "Vy" });

      expect((await db.doc("usernames/vy_test").get()).get("uid")).toBe("alice");
      expect((await db.doc("profiles/alice").get()).data()).toMatchObject({
        username: "vy_test",
        displayName: "Vy",
        avatarPath: null,
        status: "active",
      });
      expect(await exists("users/alice")).toBe(false); // settings are written at S09
    });

    it("lets exactly one of many concurrent users win the same username, leaving no partial data", async () => {
      const uids = ["u1", "u2", "u3", "u4", "u5"];
      const results = await Promise.all(uids.map((u) => profile(u, { username: "racer", displayName: u })));

      expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409, 409, 409]);
      const winnerIdx = results.findIndex((r) => r.status === 201);
      expect((await db.doc("usernames/racer").get()).get("uid")).toBe(uids[winnerIdx]);
      for (const [i, r] of results.entries()) {
        if (i === winnerIdx) continue;
        expect(r.body.error.code).toBe("USERNAME_TAKEN");
        expect(await exists(`profiles/${uids[i]}`)).toBe(false);
      }
    });

    it("rejects a username owned by another user without writing anything", async () => {
      await profile("alice", valid);
      const res = await profile("bob", { username: "VY_TEST", displayName: "Bob" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("USERNAME_TAKEN");
      expect(await exists("profiles/bob")).toBe(false);
      expect((await db.doc("usernames/vy_test").get()).get("uid")).toBe("alice");
    });

    it("treats a replay as a no-op (200, nothing rewritten)", async () => {
      await profile("alice", valid);
      const before = await db.doc("profiles/alice").get();
      const again = await profile("alice", { ...valid, displayName: "Different" });
      expect(again.status).toBe(200);
      expect(again.body.profile).toEqual({ username: "vy_test", displayName: "Vy" });
      expect((await db.doc("profiles/alice").get()).updateTime!.isEqual(before.updateTime!)).toBe(true);
    });

    it("refuses to change the username once the profile exists", async () => {
      await profile("alice", valid);
      const res = await profile("alice", { username: "new_name", displayName: "Vy" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INVALID_STATE");
      expect(await exists("usernames/new_name")).toBe(false);
    });

    it("validates usernames and display names, and rejects unknown fields", async () => {
      const bad: Record<string, unknown> = {};
      for (const username of ["ab", "a".repeat(21), "has space", ".dot", "dot.", "_abc", "abc_", "bad/slash", "ünï", "admin", "MUSER"]) {
        bad[`username ${username}`] = { username, displayName: "Vy" };
      }
      bad["empty name"] = { ...valid, displayName: "  " };
      bad["long name"] = { ...valid, displayName: "x".repeat(41) };
      bad["control char"] = { ...valid, displayName: "bad\u0007name" };
      bad["unknown uid"] = { ...valid, uid: "mallory" };
      bad["unknown avatarPath"] = { ...valid, avatarPath: "x" };
      bad["no body"] = undefined;
      for (const [name, body] of Object.entries(bad)) {
        const res = await profile("alice", body);
        expect(res.status, name).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
      expect(await exists("profiles/alice")).toBe(false);
      expect((await profile("alice", { username: "a.b_c9", displayName: "Vy" })).status).toBe(201);
    });
  });

  describe("username availability", () => {
    it("reports free, taken and your own names, and rejects invalid ones", async () => {
      expect((await available("bob", "vy_test")).body.available).toBe(true);
      await profile("alice", valid);
      expect((await available("bob", "vy_test")).body.available).toBe(false);
      expect((await available("alice", "VY_TEST")).body).toMatchObject({ username: "vy_test", available: true });
      expect((await available("bob", "a b")).status).toBe(400);
      expect((await available("bob", "admin")).status).toBe(400);
    });
  });

  describe("S09: complete onboarding", () => {
    it("requires the profile first and writes nothing without it", async () => {
      const res = await onboard("alice", { seedTagIds: ["genre_pop"] });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INVALID_STATE");
      expect(await exists("users/alice")).toBe(false);
    });

    it("saves taste choices and private settings with a trusted server time", async () => {
      await profile("alice", valid);
      const res = await onboard("alice", {
        seedTagIds: ["genre_pop", "mood_chill"],
        seedSongIds: ["s1", "s2"],
        seedArtistIds: ["a1"],
      });
      expect(res.status).toBe(201);
      expect(res.body.onboardingCompleted).toBe(true);

      const user = await db.doc("users/alice").get();
      expect(user.data()).toMatchObject({
        seedTagIds: ["genre_pop", "mood_chill"],
        seedSongIds: ["s1", "s2"],
        seedArtistIds: ["a1"],
        discoveryLevel: "explore",
        sharingEnabled: false, // default off
        shareEpoch: 0,
        activityReadThroughAt: null,
      });
      expect(user.get("onboardingCompletedAt")).toBeTruthy();
    });

    it("accepts skipped steps and an explicit sharing choice (epoch stays 0)", async () => {
      await profile("alice", valid);
      expect((await onboard("alice", { sharingEnabled: true })).status).toBe(201);
      expect((await db.doc("users/alice").get()).data()).toMatchObject({
        seedTagIds: [],
        seedSongIds: [],
        seedArtistIds: [],
        sharingEnabled: true,
        shareEpoch: 0,
      });
    });

    it("treats a replay as a no-op even with different choices (200, nothing rewritten)", async () => {
      await profile("alice", valid);
      await onboard("alice", { seedTagIds: ["genre_pop"] });
      const before = await db.doc("users/alice").get();
      const again = await onboard("alice", { seedTagIds: ["mood_chill"], sharingEnabled: true });
      expect(again.status).toBe(200);
      const after = await db.doc("users/alice").get();
      expect(after.updateTime!.isEqual(before.updateTime!)).toBe(true);
      expect(after.get("seedTagIds")).toEqual(["genre_pop"]);
    });

    it("rejects unknown fields (including username) so a client cannot set uid, epoch or similar", async () => {
      await profile("alice", valid);
      for (const extra of [{ username: "other" }, { uid: "mallory" }, { shareEpoch: 5 }, { onboardingCompletedAt: "2020-01-01" }, { discoveryLevel: "surprise" }]) {
        const res = await onboard("alice", extra);
        expect(res.status, JSON.stringify(extra)).toBe(400);
      }
      expect(await exists("users/alice")).toBe(false);
    });

    it("validates seed limits, duplicates and field types", async () => {
      await profile("alice", valid);
      const cases: Record<string, unknown> = {
        "six songs": { seedSongIds: ["s1", "s2", "s3", "s4", "s5", "s6"] },
        "duplicate ids": { seedTagIds: ["genre_pop", "genre_pop"] },
        "path-like id": { seedTagIds: ["a/b"] },
        "sharing not boolean": { sharingEnabled: "yes" },
        "no body": undefined,
      };
      for (const [name, body] of Object.entries(cases)) {
        const res = await onboard("alice", body);
        expect(res.status, name).toBe(400);
      }
      expect(await exists("users/alice")).toBe(false);
    });

    it("rejects unknown, archived or unavailable catalog references and writes nothing", async () => {
      await profile("alice", valid);
      const res = await onboard("alice", {
        seedTagIds: ["genre_pop", "genre_old", "nope"],
        seedSongIds: ["s1", "s_gone"],
        seedArtistIds: ["ghost"],
      });
      expect(res.status).toBe(400);
      expect(res.body.error.details.missing.sort()).toEqual(
        ["artist:ghost", "song:s_gone", "tag:genre_old", "tag:nope"].sort(),
      );
      expect(await exists("users/alice")).toBe(false);
    });
  });

  describe("GET /v1/me drives the app's setup routing", () => {
    it("moves from no profile, to profile only, to completed", async () => {
      const fresh = (await me("alice")).body;
      expect(fresh).toMatchObject({ hasProfile: false, onboardingCompleted: false, profile: null }); // resume at S05

      await profile("alice", valid);
      const partway = (await me("alice")).body;
      expect(partway).toMatchObject({ hasProfile: true, onboardingCompleted: false }); // user left after S05: resume at S06
      expect(partway.profile.username).toBe("vy_test");

      await onboard("alice", {});
      expect((await me("alice")).body).toMatchObject({ hasProfile: true, onboardingCompleted: true }); // go to Explore
    });

    it("keeps each caller's data separate", async () => {
      await profile("alice", valid);
      const bob = (await me("bob")).body;
      expect(bob).toMatchObject({ hasProfile: false, onboardingCompleted: false, profile: null });
    });
  });
});
