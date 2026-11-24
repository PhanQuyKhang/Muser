import { z } from "zod";
import { USERNAME_MAX, USERNAME_MIN, USERNAME_PATTERN, isReservedUsername } from "../domain/username";

// Username input is trimmed and lowercased, then must match the policy.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN)
  .max(USERNAME_MAX)
  .regex(USERNAME_PATTERN, "Use a-z, 0-9, _ and . (start and end with a letter or digit)")
  .refine((u) => !isReservedUsername(u), "That username is not available");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[^\p{Cc}\p{Cf}]+$/u, "Invalid characters");
