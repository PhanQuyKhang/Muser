import { getAuth } from "firebase-admin/auth";
import type { Actor } from "../../../shared/request-context";
import type { TokenVerifier } from "../application/ports/token-verifier";

export class FirebaseTokenVerifier implements TokenVerifier {
  /**
   * @param checkRevoked also reject tokens of revoked/disabled sessions (one extra Auth lookup).
   *        Use for sensitive operations; the default keeps ordinary requests fast.
   */
  constructor(private readonly checkRevoked = false) {}

  async verify(idToken: string): Promise<Actor> {
    // Verifies signature, project (audience), issuer and expiry.
    const decoded = await getAuth().verifyIdToken(idToken, this.checkRevoked);
    return { uid: decoded.uid, email: decoded.email, emailVerified: decoded.email_verified };
  }
}
