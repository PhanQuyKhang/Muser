import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./bootstrap/app";
import { systemClock } from "./shared/clock";
import { CatalogService } from "./modules/catalog/application/catalog.service";
import { FirestoreCatalogRepository } from "./modules/catalog/infrastructure/firestore-catalog.repository";
import { CheckUsernameUseCase } from "./modules/identity/application/check-username.use-case";
import { CompleteOnboardingUseCase } from "./modules/identity/application/complete-onboarding.use-case";
import { CreateProfileUseCase } from "./modules/identity/application/create-profile.use-case";
import { GetMeUseCase } from "./modules/identity/application/get-me.use-case";
import { FirebaseTokenVerifier } from "./modules/identity/infrastructure/firebase-token-verifier";
import {
  FirestoreIdentityQueries,
  FirestoreIdentityUnitOfWork,
} from "./modules/identity/infrastructure/firestore-identity";

initializeApp();
const db = getFirestore();

const catalog = new CatalogService(new FirestoreCatalogRepository(db), systemClock);
const identityUow = new FirestoreIdentityUnitOfWork(db);
const identityQueries = new FirestoreIdentityQueries(db);
const identity = {
  createProfile: new CreateProfileUseCase(identityUow),
  completeOnboarding: new CompleteOnboardingUseCase(identityUow, {
    findMissing: (refs) => catalog.findMissingReferences(refs),
  }),
  checkUsername: new CheckUsernameUseCase(identityQueries),
  getMe: new GetMeUseCase(identityQueries),
};

// NOTE: before the first deploy, set the function region to match the Firestore region
// (see docs/MUSER_DEPLOYMENT.md). It is intentionally not defaulted here.
export const api = onRequest(createApp({ verifier: new FirebaseTokenVerifier(), identity, catalog }));
