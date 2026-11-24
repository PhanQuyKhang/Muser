import express from "express";
import { errorHandler, notFoundHandler } from "../shared/errors";
import { requestContext } from "../shared/request-context";
import type { TokenVerifier } from "../modules/identity/application/ports/token-verifier";
import { authenticate } from "../modules/identity/transport/auth.middleware";
import { meRouter } from "../modules/identity/transport/me.controller";
import { onboardingRouter } from "../modules/identity/transport/onboarding.controller";
import { profileRouter } from "../modules/identity/transport/profile.controller";
import type { IdentityServices } from "../modules/identity/identity.services";
import type { CatalogService } from "../modules/catalog/application/catalog.service";
import { catalogRouter } from "../modules/catalog/transport/catalog.controller";

export interface AppDependencies {
  verifier: TokenVerifier;
  identity: IdentityServices;
  catalog: CatalogService;
}

// Composition root: build the HTTP app from injected dependencies.
export function createApp({ verifier, identity, catalog }: AppDependencies) {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(express.json({ limit: "100kb" }));

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  // Everything under /v1 requires a verified Firebase ID token.
  app.use(
    "/v1",
    authenticate(verifier),
    meRouter(identity.getMe),
    profileRouter(identity.createProfile, identity.checkUsername),
    onboardingRouter(identity.completeOnboarding),
    catalogRouter(catalog),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
