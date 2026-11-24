import { AuthError, type AuthErrorCode } from "@/domain/auth";

const codes: Record<string, AuthErrorCode> = {
  "auth/invalid-credential": "invalid-credentials",
  "auth/invalid-login-credentials": "invalid-credentials",
  "auth/wrong-password": "invalid-credentials",
  "auth/user-not-found": "invalid-credentials",
  "auth/email-already-in-use": "email-in-use",
  "auth/weak-password": "weak-password",
  "auth/invalid-email": "invalid-email",
  "auth/too-many-requests": "too-many-requests",
  "auth/network-request-failed": "network",
};

/** Translates a Firebase Auth error into the app's own AuthError (no SDK types leak out of data/). */
export function mapAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return new AuthError(codes[code] ?? "unknown");
}
