import type { Actor } from "../../../../shared/request-context";

// Substitution boundary: production uses Firebase Admin; unit tests inject a fake.
export interface TokenVerifier {
  /** Resolves the actor for a valid ID token, or rejects. */
  verify(idToken: string): Promise<Actor>;
}
