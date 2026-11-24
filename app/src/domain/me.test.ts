import { resolveStartRoute } from "./me";

describe("resolveStartRoute", () => {
  it("sends a user without a profile to profile setup (S05)", () => {
    expect(resolveStartRoute({ hasProfile: false, onboardingCompleted: false })).toBe("/profile");
  });
  it("resumes unfinished onboarding at music types (S06)", () => {
    expect(resolveStartRoute({ hasProfile: true, onboardingCompleted: false })).toBe(
      "/music-types",
    );
  });
  it("sends a finished user to Explore", () => {
    expect(resolveStartRoute({ hasProfile: true, onboardingCompleted: true })).toBe("/explore");
  });
});
