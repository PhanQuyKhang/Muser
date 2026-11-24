/** The signed-in caller plus how far through setup they are (GET /v1/me). */
export interface Me {
  uid: string;
  email: string | null;
  hasProfile: boolean;
  onboardingCompleted: boolean;
}

export interface MeRepository {
  getMe(): Promise<Me>;
}

export type StartRoute = "/profile" | "/music-types" | "/explore";

/**
 * Where a signed-in user lands: unfinished setup resumes at S05 (profile) or S06 (music types),
 * otherwise Explore. See docs/MUSER_DESIGN.md §9.2.
 */
export function resolveStartRoute(me: Pick<Me, "hasProfile" | "onboardingCompleted">): StartRoute {
  if (!me.hasProfile) return "/profile";
  if (!me.onboardingCompleted) return "/music-types";
  return "/explore";
}
