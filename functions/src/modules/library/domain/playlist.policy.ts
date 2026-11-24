import type { Playlist } from "./library";

/**
 * A playlist is usable by its owner only while it is active. Anyone else, a missing
 * playlist and a playlist being deleted are all treated the same ("not found"), so a
 * caller cannot learn that someone else's playlist exists.
 */
export function isUsableBy(playlist: Playlist | null, uid: string): playlist is Playlist {
  return playlist !== null && playlist.ownerId === uid && playlist.status === "active";
}
