import type { Song } from "../../catalog/domain/catalog";
import type { Clock } from "../../../shared/clock";
import { AppError } from "../../../shared/errors";
import type { UnitOfWork } from "../../../shared/unit-of-work";
import type { Like, LikeSource, Playlist, PlaylistItem } from "../domain/library";
import { isUsableBy } from "../domain/playlist.policy";
import type {
  LibraryQueries,
  LibraryRepositories,
  PlaylistCleanup,
  Sort,
  SongLookup,
  TimeCursor,
} from "./ports/library-repositories";

export function encodeCursor(c: TimeCursor): string {
  return Buffer.from(JSON.stringify({ t: c.millis, i: c.id })).toString("base64url");
}

export function decodeCursor(raw: string): TimeCursor {
  try {
    const o = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (Number.isSafeInteger(o?.t) && o.t >= 0 && typeof o?.i === "string" && o.i.length > 0 && o.i.length <= 128) {
      return { millis: o.t, id: o.i };
    }
  } catch {
    /* fall through */
  }
  throw new AppError("VALIDATION_ERROR", "Invalid cursor");
}

export interface LibraryDeps {
  uow: UnitOfWork<LibraryRepositories>;
  queries: LibraryQueries;
  cleanup: PlaylistCleanup;
  songs: SongLookup;
  clock: Clock;
  newId: () => string;
}

export interface ListInput {
  limit: number;
  sort: Sort;
  cursor?: string;
}

export interface LikeEntry {
  like: Like;
  /** null when the song is no longer available; the like itself is kept. */
  song: Song | null;
}

export interface PlaylistItemEntry {
  item: PlaylistItem;
  song: Song | null;
}

const notFound = () => new AppError("NOT_FOUND", "Playlist not found");

export class LibraryService {
  constructor(private readonly d: LibraryDeps) {}

  // ---------------------------------------------------------------- Liked

  /** Idempotent save. Saving an already-liked song changes nothing (no new likedAt). */
  async likeSong(
    uid: string,
    songId: string,
    input: { source: LikeSource; sourceShareId: string | null },
  ): Promise<{ created: boolean; like: Like }> {
    await this.d.songs.getSong(songId); // NOT_FOUND unless the song exists and is active
    const now = this.d.clock.now(); // fixed outside the transaction so a retry reuses it

    return this.d.uow.run(async ({ likes }) => {
      const existing = await likes.get(uid, songId);
      if (existing) return { created: false, like: existing };

      const like: Like = {
        songId,
        likedAt: now,
        source: input.source,
        sourceShareId: input.source === "friends" ? input.sourceShareId : null,
        activeShareId: null, // the Sharing module creates the share in this same transaction later
      };
      await likes.create(uid, like);
      return { created: true, like };
    });
  }

  /** Idempotent. Never touches playlist memberships or past reactions. */
  async unlikeSong(uid: string, songId: string): Promise<void> {
    await this.d.uow.run(async ({ likes }) => {
      const existing = await likes.get(uid, songId);
      if (!existing) return;
      // Sharing will deactivate existing.activeShareId in this same transaction.
      await likes.delete(uid, songId);
    });
  }

  async listLikes(uid: string, input: ListInput): Promise<{ items: LikeEntry[]; nextCursor: string | null }> {
    const page = await this.d.queries.listLikes(uid, {
      limit: input.limit,
      sort: input.sort,
      after: input.cursor ? decodeCursor(input.cursor) : undefined,
    });
    const songs = await this.d.songs.getSongsByIds(page.items.map((l) => l.songId));
    return {
      items: page.items.map((like) => ({ like, song: songs.get(like.songId) ?? null })),
      nextCursor: page.next ? encodeCursor(page.next) : null,
    };
  }

  // ------------------------------------------------------------ Playlists

  async createPlaylist(uid: string, name: string): Promise<Playlist> {
    const now = this.d.clock.now();
    const playlist: Playlist = {
      id: this.d.newId(), // random ID: a playlist is an entity, not a membership
      ownerId: uid,
      name,
      coverPath: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    await this.d.uow.run(({ playlists }) => playlists.create(playlist));
    return playlist;
  }

  async listPlaylists(
    uid: string,
    input: { limit: number; cursor?: string },
  ): Promise<{ items: Playlist[]; nextCursor: string | null }> {
    const page = await this.d.queries.listPlaylists(uid, {
      limit: input.limit,
      after: input.cursor ? decodeCursor(input.cursor) : undefined,
    });
    return { items: page.items, nextCursor: page.next ? encodeCursor(page.next) : null };
  }

  async getPlaylist(uid: string, id: string): Promise<Playlist> {
    const playlist = await this.d.queries.getPlaylist(id);
    if (!isUsableBy(playlist, uid)) throw notFound();
    return playlist;
  }

  async renamePlaylist(uid: string, id: string, name: string): Promise<Playlist> {
    const now = this.d.clock.now();
    return this.d.uow.run(async ({ playlists }) => {
      const playlist = await playlists.get(id);
      if (!isUsableBy(playlist, uid)) throw notFound();
      await playlists.update(id, { name, updatedAt: now });
      return { ...playlist, name, updatedAt: now };
    });
  }

  /**
   * Idempotent. Marks the playlist "deleting" (hiding it and blocking new items), then
   * removes its items and finally the playlist. If cleanup is interrupted the playlist
   * stays hidden, and repeating the request finishes the job.
   */
  async deletePlaylist(uid: string, id: string): Promise<void> {
    const now = this.d.clock.now();
    const owned = await this.d.uow.run(async ({ playlists }) => {
      const playlist = await playlists.get(id);
      if (!playlist || playlist.ownerId !== uid) return false; // nothing of the caller's to delete
      if (playlist.status === "active") await playlists.update(id, { status: "deleting", updatedAt: now });
      return true;
    });
    if (!owned) return;
    await this.d.cleanup.deleteAllItems(id);
    await this.d.cleanup.deletePlaylist(id);
  }

  async listPlaylistItems(
    uid: string,
    playlistId: string,
    input: ListInput,
  ): Promise<{ items: PlaylistItemEntry[]; nextCursor: string | null }> {
    await this.getPlaylist(uid, playlistId); // ownership + visibility
    const page = await this.d.queries.listPlaylistItems(playlistId, {
      limit: input.limit,
      sort: input.sort,
      after: input.cursor ? decodeCursor(input.cursor) : undefined,
    });
    const songs = await this.d.songs.getSongsByIds(page.items.map((i) => i.songId));
    return {
      items: page.items.map((item) => ({ item, song: songs.get(item.songId) ?? null })),
      nextCursor: page.next ? encodeCursor(page.next) : null,
    };
  }

  /** Idempotent: one membership per song. Does not touch Liked. */
  async addPlaylistSong(
    uid: string,
    playlistId: string,
    songId: string,
  ): Promise<{ created: boolean; item: PlaylistItem }> {
    await this.d.songs.getSong(songId);
    const now = this.d.clock.now();

    return this.d.uow.run(async ({ playlists, items }) => {
      // All reads first (Firestore transactions require reads before writes).
      const [playlist, existing] = await Promise.all([playlists.get(playlistId), items.get(playlistId, songId)]);
      if (!isUsableBy(playlist, uid)) throw notFound();
      if (existing) return { created: false, item: existing };

      const item: PlaylistItem = { songId, addedAt: now, position: now.getTime() };
      await items.add(playlistId, item);
      await playlists.update(playlistId, { updatedAt: now });
      return { created: true, item };
    });
  }

  /** Idempotent. Removes only the membership: never the like, a share or a reaction. */
  async removePlaylistSong(uid: string, playlistId: string, songId: string): Promise<void> {
    const now = this.d.clock.now();
    await this.d.uow.run(async ({ playlists, items }) => {
      const [playlist, existing] = await Promise.all([playlists.get(playlistId), items.get(playlistId, songId)]);
      if (!isUsableBy(playlist, uid)) throw notFound();
      if (!existing) return;
      await items.remove(playlistId, songId);
      await playlists.update(playlistId, { updatedAt: now });
    });
  }
}
