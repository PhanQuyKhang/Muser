import { HttpsError, FunctionsErrorCode } from 'firebase-functions/v2/https';

export type MuserErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVALID_STATE'
  | 'ALREADY_SENT'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE';

const ERROR_MAP: Record<MuserErrorCode, FunctionsErrorCode> = {
  UNAUTHENTICATED: 'unauthenticated',
  FORBIDDEN: 'permission-denied',
  NOT_FOUND: 'not-found',
  VALIDATION_ERROR: 'invalid-argument',
  INVALID_STATE: 'failed-precondition',
  ALREADY_SENT: 'already-exists',
  RATE_LIMITED: 'resource-exhausted',
  UNAVAILABLE: 'unavailable',
};

export class AppError extends Error {
  constructor(
    public readonly code: MuserErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  toHttpsError(): HttpsError {
    const functionsCode = ERROR_MAP[this.code] || 'internal';
    return new HttpsError(functionsCode, this.message, {
      code: this.code,
      details: this.details,
    });
  }
}

export function handleServiceError(error: unknown): never {
  if (error instanceof AppError) {
    throw error.toHttpsError();
  }
  if (error instanceof HttpsError) {
    throw error;
  }
  console.error('Unhandled internal error:', error);
  throw new HttpsError('internal', 'An internal server error occurred.');
}

