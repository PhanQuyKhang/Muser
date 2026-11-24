import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

import type { AuthRepository, AuthUser } from "@/domain/auth";
import { mapAuthError } from "./map-auth-error";

const toAuthUser = (user: User): AuthUser => ({ uid: user.uid, email: user.email });

export class FirebaseAuthRepository implements AuthRepository {
  constructor(private readonly auth: Auth) {}

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => listener(user ? toAuthUser(user) : null));
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const { user } = await signInWithEmailAndPassword(this.auth, email.trim(), password);
      return toAuthUser(user);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const { user } = await createUserWithEmailAndPassword(this.auth, email.trim(), password);
      return toAuthUser(user);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email.trim());
    } catch (error) {
      const mapped = mapAuthError(error);
      // Do not reveal whether an account exists: only real failures surface.
      if (mapped.code === "invalid-credentials") return;
      throw mapped;
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.getIdToken(forceRefresh) : null;
  }
}
