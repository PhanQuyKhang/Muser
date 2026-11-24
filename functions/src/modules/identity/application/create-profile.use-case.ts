import { AppError } from "../../../shared/errors";
import type { UnitOfWork } from "../../../shared/unit-of-work";
import { decideProfileCreation } from "../domain/profile.policy";
import type { IdentityRepositories } from "./ports/identity-repositories";

export interface CreateProfileCommand {
  uid: string; // from the VERIFIED token, never from the request body
  username: string; // already normalized by validation
  displayName: string;
}

export interface CreateProfileResult {
  /** false when the same request was replayed and the existing profile is returned. */
  created: boolean;
  profile: { username: string; displayName: string };
}

/** S05: reserve the username and create the profile in one transaction. */
export class CreateProfileUseCase {
  constructor(private readonly uow: UnitOfWork<IdentityRepositories>) {}

  execute(cmd: CreateProfileCommand): Promise<CreateProfileResult> {
    return this.uow.run(async ({ profiles, usernames }) => {
      // All reads first (Firestore transactions require reads before writes).
      const [profile, owner] = await Promise.all([profiles.get(cmd.uid), usernames.getOwner(cmd.username)]);

      const decision = decideProfileCreation(
        { existingUsername: profile?.username ?? null, usernameOwnerUid: owner },
        { uid: cmd.uid, username: cmd.username },
      );

      switch (decision.kind) {
        case "username_taken":
          throw new AppError("USERNAME_TAKEN", "That username is not available");
        case "profile_exists_with_other_username":
          throw new AppError("INVALID_STATE", "Username cannot be changed");
        case "already_created":
          return { created: false, profile: { username: profile!.username, displayName: profile!.displayName } };
        case "create":
          if (decision.reserveUsername) await usernames.reserve(cmd.username, cmd.uid);
          await profiles.save(cmd.uid, { username: cmd.username, displayName: cmd.displayName });
          return { created: true, profile: { username: cmd.username, displayName: cmd.displayName } };
      }
    });
  }
}
