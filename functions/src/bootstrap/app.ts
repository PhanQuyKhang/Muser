import express from "express";
import { errorHandler, notFoundHandler } from "../shared/errors";
import { requestContext } from "../shared/request-context";
import type { TokenVerifier } from "../modules/identity/application/ports/token-verifier";
import { authenticate } from "../modules/identity/transport/auth.middleware";
import { meRouter } from "../modules/identity/transport/me.controller";

export interface AppDependencies {
  verifier: TokenVerifier;
}

// Composition root: build the HTTP app from injected dependencies.
export function createApp({ verifier }: AppDependencies) {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(express.json({ limit: "100kb" }));

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  // Everything under /v1 requires a verified Firebase ID token.
  app.use("/v1", authenticate(verifier), meRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
