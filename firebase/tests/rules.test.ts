import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const root = resolve(__dirname, "..");
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-muser",
    firestore: { rules: readFileSync(resolve(root, "firestore.rules"), "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync(resolve(root, "storage.rules"), "utf8"), host: "127.0.0.1", port: 9199 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/alice/activity/r1"), { type: "heart_received", actorId: "bob" });
    await setDoc(doc(db, "users/alice/likes/song_x"), { songId: "song_x" });
    await setDoc(doc(db, "songs/song_x"), { title: "x" });
    await setDoc(doc(db, "shares/s1"), { ownerId: "alice" });
    await setDoc(doc(db, "profiles/alice"), { username: "alice" });
    const storage = ctx.storage();
    const bytes = new Uint8Array([1, 2, 3]);
    await uploadBytes(ref(storage, "catalog/audio/song_x/v1.mp3"), bytes, { contentType: "audio/mpeg" });
    await uploadBytes(ref(storage, "catalog/covers/album_x/v1.jpg"), bytes, { contentType: "image/jpeg" });
  });
});

describe("Firestore rules", () => {
  it("lets the owner read their own Activity", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(db, "users/alice/activity/r1")));
  });

  it("blocks other users and anonymous callers from reading someone's Activity", async () => {
    await assertFails(getDoc(doc(env.authenticatedContext("bob").firestore(), "users/alice/activity/r1")));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/alice/activity/r1")));
  });

  it("never lets a client create, edit or delete Activity (even their own)", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "users/alice/activity/fake"), { type: "heart_received" }));
    await assertFails(updateDoc(doc(db, "users/alice/activity/r1"), { actorId: "mallory" }));
    await assertFails(deleteDoc(doc(db, "users/alice/activity/r1")));
  });

  it("denies direct client reads of backend-owned data", async () => {
    const db = env.authenticatedContext("alice").firestore();
    for (const path of ["users/alice/likes/song_x", "songs/song_x", "shares/s1", "profiles/alice"]) {
      await assertFails(getDoc(doc(db, path)));
    }
  });

  it("denies all direct client writes to backend-owned data", async () => {
    const db = env.authenticatedContext("alice").firestore();
    for (const path of ["users/alice", "users/alice/likes/song_y", "songs/song_y", "shares/s2", "reactions/r9", "usernames/alice"]) {
      await assertFails(setDoc(doc(db, path), { x: 1 }));
    }
  });
});

describe("Storage rules", () => {
  const bytes = new Uint8Array([1, 2, 3]);

  it("never lets clients read or write catalog audio directly", async () => {
    const storage = env.authenticatedContext("alice").storage();
    await assertFails(getBytes(ref(storage, "catalog/audio/song_x/v1.mp3")));
    await assertFails(uploadBytes(ref(storage, "catalog/audio/song_y/v1.mp3"), bytes, { contentType: "audio/mpeg" }));
  });

  it("lets signed-in users read artwork but not anonymous callers or writers", async () => {
    await assertSucceeds(getBytes(ref(env.authenticatedContext("alice").storage(), "catalog/covers/album_x/v1.jpg")));
    await assertFails(getBytes(ref(env.unauthenticatedContext().storage(), "catalog/covers/album_x/v1.jpg")));
    await assertFails(
      uploadBytes(ref(env.authenticatedContext("alice").storage(), "catalog/covers/album_y/v1.jpg"), bytes, { contentType: "image/jpeg" }),
    );
  });

  it("allows an owner to upload a small image to their own staging avatar path", async () => {
    const storage = env.authenticatedContext("alice").storage();
    await assertSucceeds(uploadBytes(ref(storage, "staging/avatars/alice/a.jpg"), bytes, { contentType: "image/jpeg" }));
  });

  it("rejects staging uploads to another user's path, wrong type, or oversized files", async () => {
    const storage = env.authenticatedContext("alice").storage();
    await assertFails(uploadBytes(ref(storage, "staging/avatars/bob/a.jpg"), bytes, { contentType: "image/jpeg" }));
    await assertFails(uploadBytes(ref(storage, "staging/avatars/alice/a.mp3"), bytes, { contentType: "audio/mpeg" }));
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    await assertFails(uploadBytes(ref(storage, "staging/avatars/alice/big.jpg"), big, { contentType: "image/jpeg" }));
  });

  it("never lets clients write the published avatars path", async () => {
    const storage = env.authenticatedContext("alice").storage();
    await assertFails(uploadBytes(ref(storage, "avatars/alice/v1.jpg"), bytes, { contentType: "image/jpeg" }));
  });
});
