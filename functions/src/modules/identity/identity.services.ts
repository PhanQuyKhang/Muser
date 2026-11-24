import type { CheckUsernameUseCase } from "./application/check-username.use-case";
import type { CompleteOnboardingUseCase } from "./application/complete-onboarding.use-case";
import type { CreateProfileUseCase } from "./application/create-profile.use-case";
import type { GetMeUseCase } from "./application/get-me.use-case";

/** What the Identity module exposes to the HTTP layer. */
export interface IdentityServices {
  createProfile: CreateProfileUseCase;
  completeOnboarding: CompleteOnboardingUseCase;
  checkUsername: CheckUsernameUseCase;
  getMe: GetMeUseCase;
}
