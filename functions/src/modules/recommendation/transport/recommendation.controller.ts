import { Router } from "express";
import { z } from "zod";
import { toSongDto } from "../../catalog/transport/catalog.dto";
import { parse } from "../../../shared/validate";
import type { RecommendationService } from "../application/recommendation.service";
import { ALGORITHM_VERSION } from "../domain/recommend";

const query = z.object({
  level: z.enum(["familiar", "explore", "surprise"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(64).optional(),
});

export function recommendationRouter(recommendations: RecommendationService): Router {
  const router = Router();

  router.get("/recommendations", async (req, res) => {
    const input = parse(query, req.query);
    const result = await recommendations.recommend(req.actor!.uid, input);
    res.json({
      level: result.level,
      songIds: result.songs.map((s) => s.id),
      songs: result.songs.map(toSongDto),
      algorithmVersion: ALGORITHM_VERSION,
      nextCursor: result.nextCursor,
      requestId: req.requestId,
    });
  });

  return router;
}
