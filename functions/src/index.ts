import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./bootstrap/app";
import { FirebaseTokenVerifier } from "./modules/identity/infrastructure/firebase-token-verifier";

initializeApp();

// NOTE: before the first deploy, set the function region to match the Firestore region
// (see docs/MUSER_DEPLOYMENT.md). It is intentionally not defaulted here.
export const api = onRequest(createApp({ verifier: new FirebaseTokenVerifier() }));
