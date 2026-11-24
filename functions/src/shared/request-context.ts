import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

// The authenticated caller, derived ONLY from a verified ID token, never from request data.
export interface Actor {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      actor?: Actor;
    }
  }
}

export const requestContext: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
