import { AuthError } from "@/domain/auth";
import { mapAuthError } from "./map-auth-error";

describe("mapAuthError", () => {
  it.each([
    ["auth/invalid-credential", "invalid-credentials"],
    ["auth/wrong-password", "invalid-credentials"],
    ["auth/user-not-found", "invalid-credentials"],
    ["auth/email-already-in-use", "email-in-use"],
    ["auth/weak-password", "weak-password"],
    ["auth/invalid-email", "invalid-email"],
    ["auth/too-many-requests", "too-many-requests"],
    ["auth/network-request-failed", "network"],
  ])("maps %s to %s", (firebaseCode, expected) => {
    expect(mapAuthError({ code: firebaseCode }).code).toBe(expected);
  });

  it("falls back to unknown for unrecognised errors", () => {
    expect(mapAuthError({ code: "auth/something-new" }).code).toBe("unknown");
    expect(mapAuthError(new Error("boom")).code).toBe("unknown");
    expect(mapAuthError(undefined).code).toBe("unknown");
  });

  it("passes an AuthError through unchanged", () => {
    const original = new AuthError("network");
    expect(mapAuthError(original)).toBe(original);
  });
});
