import {
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import type { UnitOfWork } from "../../../shared/unit-of-work";
import type {
  PublicProfile,
  SocialQueries,
  SocialRepositories,
} from "../application/ports/social-repositories";
import {
  NOT_SHARING,
  type Friendship,
  type Heart,
  type Share,
  type SharingSettings,
} from "../domain/social";

const toDate = (v: unknown): Date => (v as Timestamp).toDate();
const at = (date: Date) => Timestamp.fromDate(date);

function toFriendship(d: DocumentSnapshot): Friendship {
  return {
    id: d.id,
    memberIds: d.get("memberIds"),
    requesterId: d.get("requesterId"),
    recipientId: d.get("recipientId"),
    status: d.get("status"),
    requestedAt: toDate(d.get("requestedAt")),
    respondedAt: d.get("respondedAt") ? toDate(d.get("respondedAt")) : null,
    updatedAt: toDate(d.get("updatedAt")),
  };
}

export function toShare(d: DocumentSnapshot): Share {
  return {
    id: d.id,
    ownerId: d.get("ownerId"),
    songId: d.get("songId"),
    sharedAt: toDate(d.get("sharedAt")),
    epoch: d.get("epoch"),
    active: d.get("active"),
  };
}

export function toSharingSettings(d: DocumentSnapshot): SharingSettings {
  if (!d.exists) return NOT_SHARING;
  return {
    sharingEnabled: d.get("sharingEnabled") === true,
    shareEpoch: d.get("shareEpoch") ?? 0,
  };
}

function toHeart(d: DocumentSnapshot): Heart {
  return {
    id: d.id,
    shareId: d.get("shareId"),
    songId: d.get("songId"),
    senderId: d.get("senderId") ?? d.get("actorId"),
    recipientId: d.get("recipientId") ?? d.ref.parent.parent?.id ?? "",
    requestId: d.get("requestId") ?? "",
    createdAt: toDate(d.get("createdAt")),
  };
}

// ---- Transaction-bound repositories: the SDK transaction never leaks past this file ----

function transactionRepositories(db: Firestore, tx: Transaction): SocialRepositories {
  const read = (path: string) => tx.get(db.doc(path));
  return {
    friendships: {
      async get(id) {
        const d = await read(`friendships/${id}`);
        return d.exists ? toFriendship(d) : null;
      },
      async save({ id, requestedAt, respondedAt, updatedAt, ...rest }) {
        tx.set(db.doc(`friendships/${id}`), {
          ...rest,
          requestedAt: at(requestedAt),
          respondedAt: respondedAt ? at(respondedAt) : null,
          updatedAt: at(updatedAt),
        });
      },
    },
    settings: {
      async get(uid) {
        return toSharingSettings(await read(`users/${uid}`));
      },
      async save(uid, settings) {
        tx.set(
          db.doc(`users/${uid}`),
          { ...settings, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      },
    },
    shares: {
      async get(id) {
        const d = await read(`shares/${id}`);
        return d.exists ? toShare(d) : null;
      },
    },
    hearts: {
      async get(id) {
        const d = await read(`reactions/${id}`);
        return d.exists ? toHeart(d) : null;
      },
      async create(heart) {
        tx.create(db.doc(`reactions/${heart.id}`), {
          shareId: heart.shareId,
          songId: heart.songId,
          senderId: heart.senderId,
          recipientId: heart.recipientId,
          requestId: heart.requestId,
          type: "heart",
          createdAt: at(heart.createdAt),
        });
        tx.create(db.doc(`users/${heart.recipientId}/activity/${heart.id}`), {
          type: "heart_received",
          reactionId: heart.id,
          actorId: heart.senderId,
          shareId: heart.shareId,
          songId: heart.songId,
          createdAt: at(heart.createdAt),
        });
      },
    },
  };
}

export class FirestoreSocialUnitOfWork implements UnitOfWork<SocialRepositories> {
  constructor(private readonly db: Firestore) {}

  run<T>(work: (repos: SocialRepositories) => Promise<T>): Promise<T> {
    return this.db.runTransaction((tx) => work(transactionRepositories(this.db, tx)));
  }
}

// ---- Queries ----

export class FirestoreSocialQueries implements SocialQueries {
  constructor(private readonly db: Firestore) {}

  private async getAll(paths: string[]): Promise<DocumentSnapshot[]> {
    if (paths.length === 0) return [];
    const docs = await this.db.getAll(...paths.map((p) => this.db.doc(p)));
    return docs.filter((d) => d.exists);
  }

  async findUidByUsername(username: string) {
    const d = await this.db.doc(`usernames/${username}`).get();
    return d.exists ? (d.get("uid") as string) : null;
  }

  async getProfiles(uids: string[]) {
    const docs = await this.getAll(uids.map((uid) => `profiles/${uid}`));
    return new Map<string, PublicProfile>(
      docs.map((d) => [
        d.id,
        {
          uid: d.id,
          username: d.get("username"),
          displayName: d.get("displayName"),
          avatarPath: d.get("avatarPath") ?? null,
        },
      ]),
    );
  }

  async getSettings(uid: string) {
    return toSharingSettings(await this.db.doc(`users/${uid}`).get());
  }

  async getFriendship(id: string) {
    const d = await this.db.doc(`friendships/${id}`).get();
    return d.exists ? toFriendship(d) : null;
  }

  // Each of these three needs its composite index in firebase/firestore.indexes.json.
  async listAccepted(uid: string, limit: number) {
    const snap = await this.db
      .collection("friendships")
      .where("memberIds", "array-contains", uid)
      .where("status", "==", "accepted")
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map(toFriendship);
  }

  listIncoming(uid: string, limit: number) {
    return this.listPending("recipientId", uid, limit);
  }

  listOutgoing(uid: string, limit: number) {
    return this.listPending("requesterId", uid, limit);
  }

  private async listPending(field: "recipientId" | "requesterId", uid: string, limit: number) {
    const snap = await this.db
      .collection("friendships")
      .where(field, "==", uid)
      .where("status", "==", "pending")
      .orderBy("requestedAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map(toFriendship);
  }

  async listShares(ownerId: string, epoch: number, limit: number) {
    const snap = await this.db
      .collection("shares")
      .where("ownerId", "==", ownerId)
      .where("epoch", "==", epoch)
      .where("active", "==", true)
      .orderBy("sharedAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map(toShare);
  }

  async getShares(ids: string[]) {
    const docs = await this.getAll(ids.map((id) => `shares/${id}`));
    return new Map(docs.map((d) => [d.id, toShare(d)]));
  }

  async findHearts(ids: string[]) {
    const docs = await this.getAll(ids.map((id) => `reactions/${id}`));
    return new Set(docs.map((d) => d.id));
  }

  async listActivity(uid: string, limit: number) {
    const snap = await this.db
      .collection(`users/${uid}/activity`)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map(toHeart);
  }
}
