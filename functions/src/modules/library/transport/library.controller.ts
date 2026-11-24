import { Router } from "express";
import { z } from "zod";
import { parse } from "../../../shared/validate";
import type { LibraryService } from "../application/library.service";
import { LIKE_SOURCES } from "../domain/library";
import { toLikeDto, toPlaylistDto, toPlaylistItemDto } from "./library.dto";

// IDs become Firestore document IDs, so reject anything that could alter the path (e.g. "/").
const id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, "Invalid id");

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(512).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});
const playlistListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(512).optional(),
});

const songParams = z.object({ songId: id });
const playlistParams = z.object({ playlistId: id });
const playlistSongParams = z.object({ playlistId: id, songId: id });

const likeBody = z
  .object({
    source: z.enum(LIKE_SOURCES),
    sourceShareId: id.nullish(),
  })
  .strict()
  .refine((b) => b.source === "friends" || b.sourceShareId == null, {
    message: "sourceShareId is only allowed when source is friends",
    path: ["sourceShareId"],
  });

// Playlist description is Post-MVP, so only the name is accepted; unknown fields are rejected.
const playlistName = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[^\p{Cc}\p{Cf}]+$/u, "Invalid characters");
const playlistBody = z.object({ name: playlistName }).strict();

export function libraryRouter(library: LibraryService): Router {
  const router = Router();

  // ---- Liked ----

  router.get("/me/likes", async (req, res) => {
    const query = parse(listQuery, req.query);
    const page = await library.listLikes(req.actor!.uid, query);
    res.json({ items: page.items.map(toLikeDto), nextCursor: page.nextCursor, requestId: req.requestId });
  });

  router.put("/me/likes/:songId", async (req, res) => {
    const { songId } = parse(songParams, req.params);
    const body = parse(likeBody, req.body);
    const { created, like } = await library.likeSong(req.actor!.uid, songId, {
      source: body.source,
      sourceShareId: body.sourceShareId ?? null,
    });
    // 201 when newly liked, 200 when it already was (nothing changed).
    res
      .status(created ? 201 : 200)
      .json({ songId: like.songId, likedAt: like.likedAt.toISOString(), source: like.source, requestId: req.requestId });
  });

  router.delete("/me/likes/:songId", async (req, res) => {
    const { songId } = parse(songParams, req.params);
    await library.unlikeSong(req.actor!.uid, songId);
    res.status(204).end();
  });

  // ---- Playlists ----

  router.post("/playlists", async (req, res) => {
    const { name } = parse(playlistBody, req.body);
    const playlist = await library.createPlaylist(req.actor!.uid, name);
    res.status(201).json({ playlist: toPlaylistDto(playlist), requestId: req.requestId });
  });

  router.get("/playlists", async (req, res) => {
    const query = parse(playlistListQuery, req.query);
    const page = await library.listPlaylists(req.actor!.uid, query);
    res.json({ items: page.items.map(toPlaylistDto), nextCursor: page.nextCursor, requestId: req.requestId });
  });

  router.get("/playlists/:playlistId", async (req, res) => {
    const { playlistId } = parse(playlistParams, req.params);
    const playlist = await library.getPlaylist(req.actor!.uid, playlistId);
    res.json({ playlist: toPlaylistDto(playlist), requestId: req.requestId });
  });

  router.patch("/playlists/:playlistId", async (req, res) => {
    const { playlistId } = parse(playlistParams, req.params);
    const { name } = parse(playlistBody, req.body);
    const playlist = await library.renamePlaylist(req.actor!.uid, playlistId, name);
    res.json({ playlist: toPlaylistDto(playlist), requestId: req.requestId });
  });

  router.delete("/playlists/:playlistId", async (req, res) => {
    const { playlistId } = parse(playlistParams, req.params);
    await library.deletePlaylist(req.actor!.uid, playlistId);
    res.status(204).end();
  });

  router.get("/playlists/:playlistId/items", async (req, res) => {
    const { playlistId } = parse(playlistParams, req.params);
    const query = parse(listQuery, req.query);
    const page = await library.listPlaylistItems(req.actor!.uid, playlistId, query);
    res.json({ items: page.items.map(toPlaylistItemDto), nextCursor: page.nextCursor, requestId: req.requestId });
  });

  router.put("/playlists/:playlistId/items/:songId", async (req, res) => {
    const { playlistId, songId } = parse(playlistSongParams, req.params);
    const { created, item } = await library.addPlaylistSong(req.actor!.uid, playlistId, songId);
    res
      .status(created ? 201 : 200)
      .json({ songId: item.songId, addedAt: item.addedAt.toISOString(), requestId: req.requestId });
  });

  router.delete("/playlists/:playlistId/items/:songId", async (req, res) => {
    const { playlistId, songId } = parse(playlistSongParams, req.params);
    await library.removePlaylistSong(req.actor!.uid, playlistId, songId);
    res.status(204).end();
  });

  return router;
}
