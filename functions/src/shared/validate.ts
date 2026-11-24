import type { ZodType } from "zod";
import { AppError } from "./errors";

/** Runtime validation of untrusted input (TypeScript types vanish at runtime). */
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid request",
      result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }
  return result.data;
}
