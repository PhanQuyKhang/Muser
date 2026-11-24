export type FieldError = "required" | "invalid-email" | "too-short" | "mismatch";

export const MIN_PASSWORD_LENGTH = 8;

// Intentionally permissive: the identity provider makes the final call.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): FieldError | null {
  const email = value.trim();
  if (!email) return "required";
  return EMAIL_PATTERN.test(email) ? null : "invalid-email";
}

/** Login only requires a value; the length rule applies when choosing a new password. */
export function validateExistingPassword(value: string): FieldError | null {
  return value ? null : "required";
}

export function validateNewPassword(value: string): FieldError | null {
  if (!value) return "required";
  return value.length >= MIN_PASSWORD_LENGTH ? null : "too-short";
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): FieldError | null {
  if (!confirmation) return "required";
  return password === confirmation ? null : "mismatch";
}
