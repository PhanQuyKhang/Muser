import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./bootstrap/app";
import { systemClock } from "./shared/clock";
import { CatalogService } from "./modules/catalog/application/catalog.service";
import { FirestoreCatalogRepository } from "./modules/catalog/infrastructure/firestore-catalog.repository";
import { FirebaseTokenVerifier } from "./modules/identity/infrastructure/firebase-token-verifier";

initializeApp();

const catalog = new CatalogService(new FirestoreCatalogRepository(getFirestore()), systemClock);

// NOTE: before the first deploy, set the function region to match the Firestore region
// (see docs/MUSER_DEPLOYMENT.md). It is intentionally not defaulted here.
export const api = onRequest(createApp({ verifier: new FirebaseTokenVerifier(), catalog }));
