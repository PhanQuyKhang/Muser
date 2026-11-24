import { initializeApp } from "firebase-admin/app";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../bootstrap/app";
import { FirebaseTokenVerifier } from "../infrastructure/firebase-token-verifier";

// Runs against the Firebase Auth EMULATOR with real (emulator-issued) ID tokens.
// Started via `npm test`, which sets FIREBASE_AUTH_EMULATOR_HOST. Skipped otherwise.
const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;

async function signUp(email: string, password: string): Promise<{ idToken: string; uid: string }> {
  const res = await fetch(`http://${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = (await res.json()) as { idToken: string; localId: string };
  return { idToken: body.idToken, uid: body.localId };
}

describe.skipIf(!host)("authentication against the Auth emulator", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    initializeApp({ projectId: "demo-muser" });
    app = createApp({ verifier: new FirebaseTokenVerifier() });
  });

  it("accepts a real ID token and returns the token's uid", async () => {
    const user = await signUp(`user-${Date.now()}@example.test`, `pw-${Math.random().toString(36).slice(2)}A1!`);
    const res = await request(app).get("/v1/me").set("Authorization", `Bearer ${user.idToken}`);
    expect(res.status).toBe(200);
    expect(res.body.uid).toBe(user.uid);
  });

  it("ignores a client-supplied owner id", async () => {
    const user = await signUp(`user2-${Date.now()}@example.test`, `pw-${Math.random().toString(36).slice(2)}A1!`);
    const res = await request(app)
      .get("/v1/me?ownerId=someone-else")
      .set("Authorization", `Bearer ${user.idToken}`);
    expect(res.body.uid).toBe(user.uid);
  });

  it("rejects a garbage token and a token with a tampered payload", async () => {
    const user = await signUp(`user3-${Date.now()}@example.test`, `pw-${Math.random().toString(36).slice(2)}A1!`);
    const [header, , signature] = user.idToken.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ user_id: "attacker", sub: "attacker" })).toString("base64url");
    const forged = `${header}.${forgedPayload}.${signature}`;

    const garbage = await request(app).get("/v1/me").set("Authorization", "Bearer not.a.token");
    const tampered = await request(app).get("/v1/me").set("Authorization", `Bearer ${forged}`);
    expect(garbage.status).toBe(401);
    expect(tampered.status).toBe(401);
  });
});
