import type { Song } from "../../../catalog/domain/catalog";
import type { Like, Playlist, PlaylistItem } from "../../domain/library";

/** Position in a (time, id) ordering; the id is the deterministic tie-breaker. */
export interface TimeCursor {
  millis: number;
  id: string;
}

export type Sort = "newest" | "oldest";

export interface ListQuery {
  limit: number;
  sort: Sort;
  after?: TimeCursor;
}

export interface Page<T> {
  items: T[];
  next: TimeCursor | null;
}

// ---- Transaction-bound repositories (used inside UnitOfWork.run) ----

export interface LikeRepository {
  get(uid: string, songId: string): Promise<Like | null>;
  create(uid: string, like: Like): Promise<void>;
  delete(uid: string, songId: string): Promise<void>;
}

export interface PlaylistRepository {
  get(id: string): Promise<Playlist | null>;
  create(playlist: Playlist): Promise<void>;
  update(id: string, patch: { name?: string; status?: "deleting"; updatedAt: Date }): Promise<void>;
}

export interface PlaylistItemRepository {
  get(playlistId: string, songId: string): Promise<PlaylistItem | null>;
  add(playlistId: string, item: PlaylistItem): Promise<void>;
  remove(playlistId: string, songId: string): Promise<void>;
}

/** The share half of a like (MUSER_DATABASE.md §7): same transaction as the like itself. */
export interface LikeSharingRepository {
  getSettings(uid: string): Promise<{ sharingEnabled: boolean; shareEpoch: number }>;
  create(share: { id: string; ownerId: string; songId: string; sharedAt: Date; epoch: number }): Promise<void>;
  deactivate(shareId: string, at: Date): Promise<void>;
}

export interface LibraryRepositories {
  sharing: LikeSharingRepository;
  likes: LikeRepository;
  playlists: PlaylistRepository;
  items: PlaylistItemRepository;
}

// ---- Non-transactional ports ----

export interface LibraryQueries {
  listLikes(uid: string, query: ListQuery): Promise<Page<Like>>;
  /** The caller's ACTIVE playlists, most recently updated first. */
  listPlaylists(uid: string, query: { limit: number; after?: TimeCursor }): Promise<Page<Playlist>>;
  getPlaylist(id: string): Promise<Playlist | null>;
  listPlaylistItems(playlistId: string, query: ListQuery): Promise<Page<PlaylistItem>>;
}

/** Retryable cleanup: Firestore does not delete subcollections with their parent. */
export interface PlaylistCleanup {
  deleteAllItems(playlistId: string): Promise<void>;
  deletePlaylist(playlistId: string): Promise<void>;
}

/** Catalog lookups the Library needs (implemented by the Catalog module). */
export interface SongLookup {
  /** Throws NOT_FOUND when the song does not exist or is not active. */
  getSong(id: string): Promise<Song>;
  /** Active songs only; ids that are unavailable are simply absent from the map. */
  getSongsByIds(ids: string[]): Promise<Map<string, Song>>;
}
