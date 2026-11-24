import type { Profile } from "../domain/identity";
import type { IdentityQueries } from "./ports/identity-repositories";

export class GetMeUseCase {
  constructor(private readonly queries: IdentityQueries) {}

  /** The app uses onboardingCompleted to route to Explore or resume the setup flow. */
  execute(uid: string): Promise<{ profile: Profile | null; onboardingCompleted: boolean }> {
    return this.queries.getMe(uid);
  }
}
