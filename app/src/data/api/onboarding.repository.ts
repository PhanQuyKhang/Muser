import {
  OnboardingError,
  type OnboardingInput,
  type OnboardingRepository,
  type ProfileInput,
} from "@/domain/onboarding";
import { ApiError, type ApiClient } from "./client";

/** Translates transport failures into the domain's OnboardingError. */
export function mapOnboardingError(error: unknown): OnboardingError {
  if (error instanceof OnboardingError) return error;
  if (error instanceof ApiError) {
    if (error.code === "USERNAME_TAKEN") return new OnboardingError("username-taken");
    if (error.code === "VALIDATION_ERROR") return new OnboardingError("invalid");
    if (error.code === "NETWORK") return new OnboardingError("network");
  }
  return new OnboardingError("unknown");
}

export class ApiOnboardingRepository implements OnboardingRepository {
  constructor(private readonly api: ApiClient) {}

  async createProfile(input: ProfileInput): Promise<void> {
    try {
      await this.api.post("/me/profile", input);
    } catch (error) {
      throw mapOnboardingError(error);
    }
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { available } = await this.api.get<{ available: boolean }>(
        `/usernames/${encodeURIComponent(username)}/available`,
      );
      return available;
    } catch (error) {
      throw mapOnboardingError(error);
    }
  }

  async complete(input: OnboardingInput): Promise<void> {
    try {
      await this.api.post("/onboarding", input);
    } catch (error) {
      throw mapOnboardingError(error);
    }
  }
}
