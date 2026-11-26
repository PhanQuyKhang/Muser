import { FieldPath, type Firestore, type Query, type QueryDocumentSnapshot, type DocumentData } from "firebase-admin/firestore";
import type {
  ArtistPage,
  ArtistQuery,
  CatalogRepository,
  SongPage,
  SongQuery,
} from "../application/ports/catalog-repository";
import type { Artist, Song, Tag } from "../domain/catalog";

const ACTIVE = "active";

function toSong(doc: { id: string; data(): DocumentData | undefined }): Song {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    title: d.title,
    normalizedTitle: d.normalizedTitle,
    artistIds: d.artistIds ?? [],
    artistNames: d.artistNames ?? [],
    albumId: d.albumId ?? null,
    coverPath: d.coverPath ?? null,
    durationMs: d.durationMs,
    peakStartMs: d.peakStartMs ?? 0,
    tagIds: d.tagIds ?? [],
    explicit: d.explicit ?? false,
    popularityRank: d.popularityRank ?? null,
  };
}

function toArtist(doc: { id: string; data(): DocumentData | undefined }): Artist {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    name: d.name,
    normalizedName: d.normalizedName,
    imagePath: d.imagePath ?? null,
    tagIds: d.tagIds ?? [],
  };
}

export class FirestoreCatalogRepository implements CatalogRepository {
  constructor(private readonly db: Firestore) {}

  async listTags(): Promise<Tag[]> {
    const snap = await this.db.collection("tags").where("status", "==", ACTIVE).get();
    return snap.docs.map((d) => ({ id: d.id, label: d.get("label"), category: d.get("category") }));
  }

  async listSongs(query: SongQuery): Promise<SongPage> {
    let q: Query = this.db.collection("songs").where("status", "==", ACTIVE);
    // Needs the composite indexes in firebase/firestore.indexes.json (the emulator does not enforce them).
    if (query.tagId) q = q.where("tagIds", "array-contains", query.tagId);
    if (query.artistId) q = q.where("artistIds", "array-contains", query.artistId);
    q = q.orderBy("normalizedTitle").orderBy(FieldPath.documentId());
    if (query.after) q = q.startAfter(query.after.sortKey, query.after.id);

    // Read one extra row to know whether another page exists.
    const snap = await q.limit(query.limit + 1).get();
    const docs: QueryDocumentSnapshot[] = snap.docs;
    const pageDocs = docs.slice(0, query.limit);
    const last = pageDocs[pageDocs.length - 1];
    return {
      items: pageDocs.map(toSong),
      next: docs.length > query.limit && last ? { sortKey: last.get("normalizedTitle"), id: last.id } : null,
    };
  }

  async getSong(id: string): Promise<Song | null> {
    const doc = await this.db.collection("songs").doc(id).get();
    return doc.exists && doc.get("status") === ACTIVE ? toSong(doc) : null;
  }

  async getAlbumTitle(id: string): Promise<string | null> {
    const doc = await this.db.collection("albums").doc(id).get();
    const title: unknown = doc.get("title");
    return typeof title === "string" ? title : null;
  }

  async listArtists(query: ArtistQuery): Promise<ArtistPage> {
    let q: Query = this.db.collection("artists").where("status", "==", ACTIVE);
    // Needs the composite indexes in firebase/firestore.indexes.json (the emulator does not enforce them).
    if (query.tagId) q = q.where("tagIds", "array-contains", query.tagId);
    q = q.orderBy("normalizedName").orderBy(FieldPath.documentId());
    if (query.after) q = q.startAfter(query.after.sortKey, query.after.id);

    const snap = await q.limit(query.limit + 1).get();
    const pageDocs = snap.docs.slice(0, query.limit);
    const last = pageDocs[pageDocs.length - 1];
    return {
      items: pageDocs.map(toArtist),
      next: snap.docs.length > query.limit && last ? { sortKey: last.get("normalizedName"), id: last.id } : null,
    };
  }

  async getSongs(ids: string[]): Promise<Song[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const docs = await this.db.getAll(...unique.map((id) => this.db.collection("songs").doc(id)));
    return docs.filter((d) => d.exists && d.get("status") === ACTIVE).map(toSong);
  }

  async getArtist(id: string): Promise<Artist | null> {
    const doc = await this.db.collection("artists").doc(id).get();
    return doc.exists && doc.get("status") === ACTIVE ? toArtist(doc) : null;
  }

  async findActiveIds(collection: "tags" | "songs" | "artists", ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const refs = ids.map((id) => this.db.collection(collection).doc(id));
    const docs = await this.db.getAll(...refs, { fieldMask: ["status"] });
    return new Set(docs.filter((d) => d.exists && d.get("status") === ACTIVE).map((d) => d.id));
  }

  async listActiveForSearch(): Promise<{ songs: Song[]; artists: Artist[] }> {
    const [songs, artists] = await Promise.all([
      this.db.collection("songs").where("status", "==", ACTIVE).get(),
      this.db.collection("artists").where("status", "==", ACTIVE).get(),
    ]);
    return { songs: songs.docs.map(toSong), artists: artists.docs.map(toArtist) };
  }
}
