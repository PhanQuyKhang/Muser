import type { IdentityQueries } from "./ports/identity-repositories";

export class CheckUsernameUseCase {
  constructor(private readonly queries: IdentityQueries) {}

  /**
   * Advisory only (so the app can warn while typing): someone can still take the name
   * before the caller submits. The transaction in CreateProfileUseCase decides.
   */
  async execute(uid: string, username: string): Promise<{ available: boolean }> {
    const owner = await this.queries.getUsernameOwner(username);
    return { available: owner === null || owner === uid };
  }
}
