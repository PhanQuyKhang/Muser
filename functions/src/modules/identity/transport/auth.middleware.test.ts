import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../bootstrap/app";
import type { CatalogService } from "../../catalog/application/catalog.service";
import type { TokenVerifier } from "../application/ports/token-verifier";

// Fake verifier: only "good-token" is valid and maps to uid "alice".
const verifier: TokenVerifier = {
  async verify(token) {
    if (token === "good-token") return { uid: "alice", email: "alice@example.test" };
    throw new Error("bad token");
  },
};
// These tests only exercise authentication, so the catalog is never called.
const app = createApp({ verifier, catalog: {} as CatalogService });

describe("authentication middleware (fake verifier)", () => {
  it("serves /healthz without authentication", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
  });

  it("rejects a missing Authorization header with the standard error shape", async () => {
    const res = await request(app).get("/v1/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
    expect(res.body.requestId).toBeTypeOf("string");
    expect(res.headers["x-request-id"]).toBe(res.body.requestId);
  });

  it("rejects malformed schemes and invalid tokens identically", async () => {
    const basic = await request(app).get("/v1/me").set("Authorization", "Basic abc");
    const bad = await request(app).get("/v1/me").set("Authorization", "Bearer nope");
    expect(basic.status).toBe(401);
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("derives the uid from the verified token only", async () => {
    const res = await request(app)
      .get("/v1/me?uid=mallory&ownerId=mallory")
      .set("Authorization", "Bearer good-token");
    expect(res.status).toBe(200);
    expect(res.body.uid).toBe("alice");
  });

  it("returns 404 in the standard shape for unknown routes (after auth)", async () => {
    const res = await request(app).get("/v1/nope").set("Authorization", "Bearer good-token");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns VALIDATION_ERROR for malformed JSON bodies", async () => {
    const res = await request(app)
      .post("/v1/me")
      .set("Authorization", "Bearer good-token")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
