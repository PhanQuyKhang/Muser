import type { AuthErrorCode } from "@/domain/auth";
import type { FieldError } from "@/domain/auth-validation";
import { strings } from "@/shared/strings";

const { errors, validation } = strings.auth;

export function authErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case "invalid-credentials":
      return errors.invalidCredentials;
    case "email-in-use":
      return errors.emailInUse;
    case "weak-password":
      return errors.weakPassword;
    case "invalid-email":
      return errors.invalidEmail;
    case "too-many-requests":
      return errors.tooManyRequests;
    case "network":
      return errors.network;
    case "unknown":
      return errors.unknown;
  }
}

export type FieldName = "email" | "password" | "confirm";

export function fieldErrorMessage(field: FieldName, error: FieldError): string {
  switch (error) {
    case "required":
      return field === "email"
        ? validation.emailRequired
        : field === "confirm"
          ? validation.confirmRequired
          : validation.passwordRequired;
    case "invalid-email":
      return validation.emailInvalid;
    case "too-short":
      return validation.passwordTooShort;
    case "mismatch":
      return validation.confirmMismatch;
  }
}
