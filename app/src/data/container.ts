import type { Services } from "@/application/services";
import { config } from "@/shared/config";
import { FirebaseAuthRepository } from "./auth/firebase-auth.repository";
import { createApiClient } from "./api/client";
import { ApiCatalogRepository } from "./api/catalog.repository";
import { ApiDiscoveryRepository } from "./api/discovery.repository";
import { ApiLibraryRepository } from "./api/library.repository";
import { ApiMeRepository } from "./api/me.repository";
import { ApiOnboardingRepository } from "./api/onboarding.repository";
import { ApiSocialRepository } from "./api/social.repository";
import { getFirebaseAuth } from "./firebase/firebase";

/** Composition root: builds the real implementations of every port. Called once at startup. */
export function createServices(): Services {
  const auth = new FirebaseAuthRepository(getFirebaseAuth(config));
  const api = createApiClient({
    baseUrl: config.apiUrl,
    getToken: (forceRefresh) => auth.getIdToken(forceRefresh),
  });
  return {
    auth,
    me: new ApiMeRepository(api),
    catalog: new ApiCatalogRepository(api),
    onboarding: new ApiOnboardingRepository(api),
    library: new ApiLibraryRepository(api),
    social: new ApiSocialRepository(api),
    discovery: new ApiDiscoveryRepository(api),
  };
}
