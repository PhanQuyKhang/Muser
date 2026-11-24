// Pure decision logic for completing onboarding (S09), after the profile exists (S05).

export interface OnboardingFacts {
  profileExists: boolean;
  /** users/{uid}.onboardingCompletedAt is set. */
  onboardingCompleted: boolean;
}

export type OnboardingDecision =
  | { kind: "profile_required" } // the username/profile step (S05) has not happened yet
  | { kind: "already_completed" } // replay: nothing is rewritten
  | { kind: "complete" };

export function decideOnboarding(facts: OnboardingFacts): OnboardingDecision {
  if (!facts.profileExists) return { kind: "profile_required" };
  if (facts.onboardingCompleted) return { kind: "already_completed" };
  return { kind: "complete" };
}
