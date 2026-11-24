import { AppError } from "../../../shared/errors";
import type { UnitOfWork } from "../../../shared/unit-of-work";
import { DEFAULT_DISCOVERY_LEVEL } from "../domain/identity";
import { decideOnboarding } from "../domain/onboarding.policy";
import type { IdentityRepositories, SeedReferenceChecker } from "./ports/identity-repositories";

export interface CompleteOnboardingCommand {
  uid: string; // from the VERIFIED token, never from the request body
  seedTagIds: string[];
  seedSongIds: string[];
  seedArtistIds: string[];
  sharingEnabled: boolean;
}

export interface OnboardingResult {
  /** false when onboarding was already completed (a replay writes nothing). */
  created: boolean;
}

/** S09: save the taste choices and mark onboarding complete. Requires the S05 profile. */
export class CompleteOnboardingUseCase {
  constructor(
    private readonly uow: UnitOfWork<IdentityRepositories>,
    private readonly seeds: SeedReferenceChecker,
  ) {}

  async execute(cmd: CompleteOnboardingCommand): Promise<OnboardingResult> {
    // Catalog check happens outside the transaction: the catalog is admin-managed and
    // the choices are only preferences, so it needs no transactional guarantee.
    const missing = await this.seeds.findMissing({
      tagIds: cmd.seedTagIds,
      songIds: cmd.seedSongIds,
      artistIds: cmd.seedArtistIds,
    });
    if (missing.length > 0) {
      throw new AppError("VALIDATION_ERROR", "Unknown or unavailable catalog items", { missing });
    }

    return this.uow.run(async ({ users, profiles }) => {
      const [user, profile] = await Promise.all([users.get(cmd.uid), profiles.get(cmd.uid)]);

      const decision = decideOnboarding({
        profileExists: profile !== null,
        onboardingCompleted: user?.onboardingCompleted ?? false,
      });

      switch (decision.kind) {
        case "profile_required":
          throw new AppError("INVALID_STATE", "Create your profile before finishing onboarding");
        case "already_completed":
          return { created: false };
        case "complete":
          await users.saveOnboarded(cmd.uid, {
            seedTagIds: cmd.seedTagIds,
            seedSongIds: cmd.seedSongIds,
            seedArtistIds: cmd.seedArtistIds,
            discoveryLevel: DEFAULT_DISCOVERY_LEVEL,
            sharingEnabled: cmd.sharingEnabled,
          });
          return { created: true };
      }
    });
  }
}
