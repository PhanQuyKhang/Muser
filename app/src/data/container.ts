import type { Services } from "@/application/services";
import { config } from "@/shared/config";
import { FirebaseAuthRepository } from "./auth/firebase-auth.repository";
import { createApiClient } from "./api/client";
import { ApiMeRepository } from "./api/me.repository";
import { getFirebaseAuth } from "./firebase/firebase";

/** Composition root: builds the real implementations of every port. Called once at startup. */
export function createServices(): Services {
  const auth = new FirebaseAuthRepository(getFirebaseAuth(config));
  const api = createApiClient({
    baseUrl: config.apiUrl,
    getToken: (forceRefresh) => auth.getIdToken(forceRefresh),
  });
  return { auth, me: new ApiMeRepository(api) };
}
