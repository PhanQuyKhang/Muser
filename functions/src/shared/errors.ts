import type { ErrorRequestHandler, RequestHandler } from "express";

// Stable error codes from docs/MUSER_DATABASE.md §11, mapped to HTTP per MUSER_ARCHITECTURE.md §7.
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVALID_STATE"
  | "USERNAME_TAKEN"
  | "ALREADY_SENT"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INVALID_STATE: 409,
  USERNAME_TAKEN: 409,
  ALREADY_SENT: 409,
  RATE_LIMITED: 429,
  UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
  get status(): number {
    return STATUS[this.code];
  }
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError("NOT_FOUND", "Route not found"));
};

// Response shape: { error: { code, message, details? }, requestId }
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let appError: AppError;
  if (err instanceof AppError) {
    appError = err;
  } else if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    appError = new AppError("VALIDATION_ERROR", "Invalid request body");
  } else {
    // Never leak internals or tokens to the client; log only the error name/message.
    console.error(JSON.stringify({ severity: "ERROR", requestId: req.requestId, name: err?.name, message: err?.message }));
    appError = new AppError("INTERNAL", "Unexpected error");
  }
  res.status(appError.status).json({
    error: { code: appError.code, message: appError.message, ...(appError.details ? { details: appError.details } : {}) },
    requestId: req.requestId,
  });
};
