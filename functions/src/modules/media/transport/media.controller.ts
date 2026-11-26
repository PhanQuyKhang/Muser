import { Router } from "express";
import { z } from "zod";
import { parse } from "../../../shared/validate";
import type { MediaService } from "../application/media.service";

// IDs become Firestore document IDs, so reject anything that could alter the path.
const params = z.object({ songId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, "Invalid id") });

export function mediaRouter(media: MediaService): Router {
  const router = Router();

  // POST because each call may issue a new short-lived link.
  router.post("/media/:songId/playback", async (req, res) => {
    const { songId } = parse(params, req.params);
    const preview = await media.issuePreview(songId);
    res.json({
      url: preview.url,
      expiresAt: preview.expiresAt.toISOString(),
      source: "deezer",
      requestId: req.requestId,
    });
  });

  router.get("/media/:songId/artwork", async (req, res) => {
    const { songId } = parse(params, req.params);
    const { coverUrl, artistImageUrl } = await media.getArtwork(songId);
    res.json({ coverUrl, artistImageUrl, requestId: req.requestId });
  });

  return router;
}
