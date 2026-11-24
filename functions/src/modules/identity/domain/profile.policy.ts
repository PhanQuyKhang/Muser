// Pure decision logic for creating the profile (S05). Receives facts loaded by
// repositories; fetches nothing and knows nothing about HTTP or Firebase.

export interface ProfileFacts {
  /** The username already on the caller's profile, if a profile exists. */
  existingUsername: string | null;
  /** uid that owns usernames/{requested}, or null if it is free. */
  usernameOwnerUid: string | null;
}

export type ProfileDecision =
  | { kind: "create"; reserveUsername: boolean }
  | { kind: "already_created" } // same request replayed: return the existing profile
  | { kind: "profile_exists_with_other_username" } // usernames are read-only once set
  | { kind: "username_taken" };

export function decideProfileCreation(
  facts: ProfileFacts,
  request: { uid: string; username: string },
): ProfileDecision {
  if (facts.existingUsername !== null) {
    return facts.existingUsername === request.username
      ? { kind: "already_created" }
      : { kind: "profile_exists_with_other_username" };
  }
  if (facts.usernameOwnerUid !== null && facts.usernameOwnerUid !== request.uid) {
    return { kind: "username_taken" };
  }
  // Already ours (e.g. reserved earlier): do not create the reservation again.
  return { kind: "create", reserveUsername: facts.usernameOwnerUid === null };
}
