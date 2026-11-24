import type { RequestHandler } from "express";
import { AppError } from "../../../shared/errors";
import type { TokenVerifier } from "../application/ports/token-verifier";

/**
 * Requires "Authorization: Bearer <Firebase ID token>" and sets req.actor from the
 * VERIFIED token. Ownership is never taken from the request body, query or params.
 * Every failure is the same 401 so callers cannot probe why a token was rejected.
 */
export function authenticate(verifier: TokenVerifier): RequestHandler {
  return async (req, _res, next) => {
    const match = /^Bearer\s+(\S+)$/i.exec(req.header("authorization") ?? "");
    if (!match) return next(new AppError("UNAUTHENTICATED", "Missing or malformed bearer token"));
    try {
      req.actor = await verifier.verify(match[1]);
      next();
    } catch {
      next(new AppError("UNAUTHENTICATED", "Invalid or expired token"));
    }
  };
}
