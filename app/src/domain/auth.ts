export interface AuthUser {
  uid: string;
  email: string | null;
}

export type AuthErrorCode =
  | "invalid-credentials"
  | "email-in-use"
  | "weak-password"
  | "invalid-email"
  | "too-many-requests"
  | "network"
  | "unknown";

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = "AuthError";
  }
}

/** Identity provider port. The Firebase implementation lives in data/. */
export interface AuthRepository {
  /** Calls back with the current user (or null) now and on every change. Returns an unsubscribe. */
  subscribe(listener: (user: AuthUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(email: string, password: string): Promise<AuthUser>;
  /** Resolves even when no account exists, so callers cannot probe for registered emails. */
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
}
