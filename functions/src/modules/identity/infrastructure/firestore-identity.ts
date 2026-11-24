import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import type { UnitOfWork } from "../../../shared/unit-of-work";
import type {
  IdentityQueries,
  IdentityRepositories,
  OnboardedSettings,
  ProfileRepository,
  UserSettingsRepository,
  UsernameRepository,
} from "../application/ports/identity-repositories";
import type { Profile } from "../domain/identity";

const profileFrom = (d: FirebaseFirestore.DocumentSnapshot): Profile | null =>
  d.exists ? { username: d.get("username"), displayName: d.get("displayName"), avatarPath: d.get("avatarPath") ?? null } : null;

// ---- Transaction-bound repositories: the SDK transaction never leaks past this file ----

class TxUserSettings implements UserSettingsRepository {
  constructor(private db: Firestore, private tx: Transaction) {}

  async get(uid: string) {
    const d = await this.tx.get(this.db.doc(`users/${uid}`));
    return d.exists ? { onboardingCompleted: d.get("onboardingCompletedAt") != null } : null;
  }

  async saveOnboarded(uid: string, s: OnboardedSettings) {
    this.tx.set(this.db.doc(`users/${uid}`), {
      onboardingCompletedAt: FieldValue.serverTimestamp(), // trusted server time
      seedTagIds: s.seedTagIds,
      seedSongIds: s.seedSongIds,
      seedArtistIds: s.seedArtistIds,
      discoveryLevel: s.discoveryLevel,
      sharingEnabled: s.sharingEnabled,
      shareEpoch: 0,
      activityReadThroughAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

class TxProfiles implements ProfileRepository {
  constructor(private db: Firestore, private tx: Transaction) {}

  async get(uid: string) {
    return profileFrom(await this.tx.get(this.db.doc(`profiles/${uid}`)));
  }

  async save(uid: string, p: { username: string; displayName: string }) {
    this.tx.set(this.db.doc(`profiles/${uid}`), {
      username: p.username,
      displayName: p.displayName,
      avatarPath: null, // null means an initials avatar
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

class TxUsernames implements UsernameRepository {
  constructor(private db: Firestore, private tx: Transaction) {}

  async getOwner(username: string) {
    const d = await this.tx.get(this.db.doc(`usernames/${username}`));
    return d.exists ? (d.get("uid") as string) : null;
  }

  async reserve(username: string, uid: string) {
    // create() fails at commit if the document already exists: a second line of defense.
    this.tx.create(this.db.doc(`usernames/${username}`), { uid, createdAt: FieldValue.serverTimestamp() });
  }
}

export class FirestoreIdentityUnitOfWork implements UnitOfWork<IdentityRepositories> {
  constructor(private readonly db: Firestore) {}

  run<T>(work: (repos: IdentityRepositories) => Promise<T>): Promise<T> {
    return this.db.runTransaction((tx) =>
      work({
        users: new TxUserSettings(this.db, tx),
        profiles: new TxProfiles(this.db, tx),
        usernames: new TxUsernames(this.db, tx),
      }),
    );
  }
}

export class FirestoreIdentityQueries implements IdentityQueries {
  constructor(private readonly db: Firestore) {}

  async getMe(uid: string) {
    const [user, profile] = await this.db.getAll(this.db.doc(`users/${uid}`), this.db.doc(`profiles/${uid}`));
    return {
      profile: profileFrom(profile),
      onboardingCompleted: user.exists && user.get("onboardingCompletedAt") != null,
    };
  }

  async getUsernameOwner(username: string) {
    const d = await this.db.doc(`usernames/${username}`).get();
    return d.exists ? (d.get("uid") as string) : null;
  }
}
