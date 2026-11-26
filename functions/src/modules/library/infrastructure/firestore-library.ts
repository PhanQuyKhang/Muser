import {
  FieldPath,
  Timestamp,
  type DocumentSnapshot,
  type Firestore,
  type Query,
  type Transaction,
} from "firebase-admin/firestore";
import type { UnitOfWork } from "../../../shared/unit-of-work";
import type {
  LibraryQueries,
  LibraryRepositories,
  LikeRepository,
  LikeSharingRepository,
  ListQuery,
  Page,
  PlaylistCleanup,
  PlaylistItemRepository,
  PlaylistRepository,
  TimeCursor,
} from "../application/ports/library-repositories";
import type { Like, Playlist, PlaylistItem } from "../domain/library";

const CLEANUP_BATCH = 400; // Firestore batches allow 500 operations

const toDate = (v: unknown): Date => (v as Timestamp).toDate();

function toLike(d: DocumentSnapshot): Like {
  return {
    songId: d.id,
    likedAt: toDate(d.get("likedAt")),
    source: d.get("source"),
    sourceShareId: d.get("sourceShareId") ?? null,
    activeShareId: d.get("activeShareId") ?? null,
  };
}

function toPlaylist(d: DocumentSnapshot): Playlist {
  return {
    id: d.id,
    ownerId: d.get("ownerId"),
    name: d.get("name"),
    coverPath: d.get("coverPath") ?? null,
    status: d.get("status"),
    createdAt: toDate(d.get("createdAt")),
    updatedAt: toDate(d.get("updatedAt")),
  };
}

function toItem(d: DocumentSnapshot): PlaylistItem {
  return { songId: d.id, addedAt: toDate(d.get("addedAt")), position: d.get("position") };
}

// ---- Transaction-bound repositories: the SDK transaction never leaks past this file ----

class TxLikes implements LikeRepository {
  constructor(private db: Firestore, private tx: Transaction) {}
  private ref = (uid: string, songId: string) => this.db.doc(`users/${uid}/likes/${songId}`);

  async get(uid: string, songId: string) {
    const d = await this.tx.get(this.ref(uid, songId));
    return d.exists ? toLike(d) : null;
  }
  async create(uid: string, like: Like) {
    this.tx.set(this.ref(uid, like.songId), {
      songId: like.songId,
      likedAt: Timestamp.fromDate(like.likedAt),
      source: like.source,
      sourceShareId: like.sourceShareId,
      activeShareId: like.activeShareId,
    });
  }
  async delete(uid: string, songId: string) {
    this.tx.delete(this.ref(uid, songId));
  }
}

class TxPlaylists implements PlaylistRepository {
  constructor(private db: Firestore, private tx: Transaction) {}

  async get(id: string) {
    const d = await this.tx.get(this.db.doc(`playlists/${id}`));
    return d.exists ? toPlaylist(d) : null;
  }
  async create(p: Playlist) {
    this.tx.create(this.db.doc(`playlists/${p.id}`), {
      ownerId: p.ownerId,
      name: p.name,
      description: null, // Post-MVP; the current UI supports a name only
      coverPath: p.coverPath,
      status: p.status,
      createdAt: Timestamp.fromDate(p.createdAt),
      updatedAt: Timestamp.fromDate(p.updatedAt),
    });
  }
  async update(id: string, patch: { name?: string; status?: "deleting"; updatedAt: Date }) {
    const { updatedAt, ...rest } = patch;
    this.tx.update(this.db.doc(`playlists/${id}`), { ...rest, updatedAt: Timestamp.fromDate(updatedAt) });
  }
}

class TxItems implements PlaylistItemRepository {
  constructor(private db: Firestore, private tx: Transaction) {}
  private ref = (playlistId: string, songId: string) => this.db.doc(`playlists/${playlistId}/items/${songId}`);

  async get(playlistId: string, songId: string) {
    const d = await this.tx.get(this.ref(playlistId, songId));
    return d.exists ? toItem(d) : null;
  }
  async add(playlistId: string, item: PlaylistItem) {
    // The song id is the document id, so a song can be in a playlist at most once.
    this.tx.create(this.ref(playlistId, item.songId), {
      songId: item.songId,
      addedAt: Timestamp.fromDate(item.addedAt),
      position: item.position,
    });
  }
  async remove(playlistId: string, songId: string) {
    this.tx.delete(this.ref(playlistId, songId));
  }
}

class TxSharing implements LikeSharingRepository {
  constructor(private db: Firestore, private tx: Transaction) {}

  async getSettings(uid: string) {
    const d = await this.tx.get(this.db.doc(`users/${uid}`));
    return {
      sharingEnabled: d.get("sharingEnabled") === true,
      shareEpoch: (d.get("shareEpoch") as number | undefined) ?? 0,
    };
  }
  async create(share: { id: string; ownerId: string; songId: string; sharedAt: Date; epoch: number }) {
    this.tx.create(this.db.doc(`shares/${share.id}`), {
      ownerId: share.ownerId,
      songId: share.songId,
      sharedAt: Timestamp.fromDate(share.sharedAt),
      epoch: share.epoch,
      active: true,
      deactivatedAt: null,
      deactivationReason: null,
    });
  }
  async deactivate(shareId: string, at: Date) {
    // merge: a share removed by account cleanup must not make the unlike fail.
    this.tx.set(
      this.db.doc(`shares/${shareId}`),
      { active: false, deactivatedAt: Timestamp.fromDate(at), deactivationReason: "unliked" },
      { merge: true },
    );
  }
}

export class FirestoreLibraryUnitOfWork implements UnitOfWork<LibraryRepositories> {
  constructor(private readonly db: Firestore) {}

  run<T>(work: (repos: LibraryRepositories) => Promise<T>): Promise<T> {
    return this.db.runTransaction((tx) =>
      work({
        likes: new TxLikes(this.db, tx),
        sharing: new TxSharing(this.db, tx),
        playlists: new TxPlaylists(this.db, tx),
        items: new TxItems(this.db, tx),
      }),
    );
  }
}

// ---- Queries ----

/**
 * Orders by (timeField, documentId) in the SAME direction, which the automatic
 * single-field indexes support, and reads one extra row to know if another page exists.
 */
async function pageDocs(
  base: Query,
  timeField: string,
  direction: "asc" | "desc",
  limit: number,
  after?: TimeCursor,
): Promise<{ docs: DocumentSnapshot[]; next: TimeCursor | null }> {
  let q = base.orderBy(timeField, direction).orderBy(FieldPath.documentId(), direction);
  if (after) q = q.startAfter(Timestamp.fromMillis(after.millis), after.id);
  const snap = await q.limit(limit + 1).get();
  const docs = snap.docs.slice(0, limit);
  const last = docs[docs.length - 1];
  const next =
    snap.docs.length > limit && last
      ? { millis: (last.get(timeField) as Timestamp).toMillis(), id: last.id }
      : null;
  return { docs, next };
}

const direction = (q: ListQuery) => (q.sort === "newest" ? "desc" : "asc");

export class FirestoreLibraryQueries implements LibraryQueries {
  constructor(private readonly db: Firestore) {}

  async listLikes(uid: string, q: ListQuery): Promise<Page<Like>> {
    const { docs, next } = await pageDocs(this.db.collection(`users/${uid}/likes`), "likedAt", direction(q), q.limit, q.after);
    return { items: docs.map(toLike), next };
  }

  async listPlaylists(uid: string, q: { limit: number; after?: TimeCursor }): Promise<Page<Playlist>> {
    // Needs the composite index (ownerId, status, updatedAt) in firebase/firestore.indexes.json.
    const base = this.db.collection("playlists").where("ownerId", "==", uid).where("status", "==", "active");
    const { docs, next } = await pageDocs(base, "updatedAt", "desc", q.limit, q.after);
    return { items: docs.map(toPlaylist), next };
  }

  async getPlaylist(id: string) {
    const d = await this.db.doc(`playlists/${id}`).get();
    return d.exists ? toPlaylist(d) : null;
  }

  async listPlaylistItems(playlistId: string, q: ListQuery): Promise<Page<PlaylistItem>> {
    const { docs, next } = await pageDocs(
      this.db.collection(`playlists/${playlistId}/items`),
      "addedAt",
      direction(q),
      q.limit,
      q.after,
    );
    return { items: docs.map(toItem), next };
  }
}

export class FirestorePlaylistCleanup implements PlaylistCleanup {
  constructor(private readonly db: Firestore) {}

  async deleteAllItems(playlistId: string): Promise<void> {
    const items = this.db.collection(`playlists/${playlistId}/items`);
    for (;;) {
      const snap = await items.limit(CLEANUP_BATCH).get();
      if (snap.empty) return;
      const batch = this.db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.db.doc(`playlists/${playlistId}`).delete();
  }
}
