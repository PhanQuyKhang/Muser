import { Router } from "express";
import { z } from "zod";
import { parse } from "../../../shared/validate";
import type { CatalogService } from "../application/catalog.service";
import { toArtistDto, toSongDto, toTagDto } from "./catalog.dto";

// IDs become Firestore document IDs, so reject anything that could alter the path (e.g. "/").
const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, "Invalid id");

const tagsQuery = z.object({ category: z.enum(["genre", "mood"]).optional() });
const songsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(512).optional(),
  tagId: idSchema.optional(),
  artistId: idSchema.optional(),
});
const songParams = z.object({ songId: idSchema });
const artistParams = z.object({ artistId: idSchema });
const searchQuery = z.object({ q: z.string().trim().min(1).max(100) });

export function catalogRouter(catalog: CatalogService): Router {
  const router = Router();

  // Tags rarely change: let the app cache them briefly.
  router.get("/catalog/tags", async (req, res) => {
    const { category } = parse(tagsQuery, req.query);
    const tags = await catalog.listTags(category);
    res.set("Cache-Control", "private, max-age=300");
    res.json({ items: tags.map(toTagDto), requestId: req.requestId });
  });

  router.get("/catalog/songs", async (req, res) => {
    const query = parse(songsQuery, req.query);
    const page = await catalog.listSongs(query);
    res.json({ items: page.items.map(toSongDto), nextCursor: page.nextCursor, requestId: req.requestId });
  });

  router.get("/catalog/songs/:songId", async (req, res) => {
    const { songId } = parse(songParams, req.params);
    res.json({ song: toSongDto(await catalog.getSong(songId)), requestId: req.requestId });
  });

  router.get("/artists/:artistId", async (req, res) => {
    const { artistId } = parse(artistParams, req.params);
    const { artist, songs } = await catalog.getArtist(artistId);
    res.json({ artist: toArtistDto(artist), songs: songs.map(toSongDto), requestId: req.requestId });
  });

  router.get("/search", async (req, res) => {
    const { q } = parse(searchQuery, req.query);
    const result = await catalog.search(q);
    res.json({
      songs: result.songs.map(toSongDto),
      artists: result.artists.map(toArtistDto),
      requestId: req.requestId,
    });
  });

  return router;
}
