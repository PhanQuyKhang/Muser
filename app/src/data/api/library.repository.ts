import type { Song } from "@/domain/catalog";
import type { LibraryEntry, LibraryRepository, LikeSource, Playlist } from "@/domain/library";
import type { ApiClient } from "./client";
import { fetchAllPages } from "./pages";

interface LikeDto {
  songId: string;
  likedAt: string;
  song: Song | null;
}

const id = encodeURIComponent;

export class ApiLibraryRepository implements LibraryRepository {
  constructor(private readonly api: ApiClient) {}

  async listLikes(): Promise<LibraryEntry[]> {
    const likes = await fetchAllPages<LikeDto>(this.api, "/me/likes");
    return likes.map(({ songId, likedAt, song }) => ({ songId, addedAt: likedAt, song }));
  }

  async like(songId: string, source: LikeSource, sourceShareId?: string): Promise<void> {
    await this.api.put(`/me/likes/${id(songId)}`, {
      source,
      ...(sourceShareId ? { sourceShareId } : {}),
    });
  }

  async unlike(songId: string): Promise<void> {
    await this.api.delete(`/me/likes/${id(songId)}`);
  }

  listPlaylists(): Promise<Playlist[]> {
    return fetchAllPages<Playlist>(this.api, "/playlists");
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const { playlist } = await this.api.post<{ playlist: Playlist }>("/playlists", { name });
    return playlist;
  }

  async renamePlaylist(playlistId: string, name: string): Promise<void> {
    await this.api.patch(`/playlists/${id(playlistId)}`, { name });
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.api.delete(`/playlists/${id(playlistId)}`);
  }

  listPlaylistSongs(playlistId: string): Promise<LibraryEntry[]> {
    return fetchAllPages<LibraryEntry>(this.api, `/playlists/${id(playlistId)}/items`);
  }

  async addToPlaylist(playlistId: string, songId: string): Promise<void> {
    await this.api.put(`/playlists/${id(playlistId)}/items/${id(songId)}`);
  }

  async removeFromPlaylist(playlistId: string, songId: string): Promise<void> {
    await this.api.delete(`/playlists/${id(playlistId)}/items/${id(songId)}`);
  }
}
