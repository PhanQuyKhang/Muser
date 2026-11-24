export type UsernameError = "required" | "too-short" | "too-long" | "invalid-chars";
export type DisplayNameError = "required" | "too-long";

// Mirrors the API policy (functions/.../domain/username.ts). The server stays the authority.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const DISPLAY_NAME_MAX = 40;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_.]*[a-z0-9])?$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): UsernameError | null {
  const username = normalizeUsername(value);
  if (!username) return "required";
  if (username.length < USERNAME_MIN) return "too-short";
  if (username.length > USERNAME_MAX) return "too-long";
  return USERNAME_PATTERN.test(username) ? null : "invalid-chars";
}

export function validateDisplayName(value: string): DisplayNameError | null {
  const name = value.trim();
  if (!name) return "required";
  return name.length > DISPLAY_NAME_MAX ? "too-long" : null;
}
