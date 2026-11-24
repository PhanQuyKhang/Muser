import { Router } from "express";
import { z } from "zod";
import { parse } from "../../../shared/validate";
import type { CompleteOnboardingUseCase } from "../application/complete-onboarding.use-case";

// IDs become Firestore document IDs: reject anything that could alter the path.
const catalogId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, "Invalid id");
const uniqueIds = (max: number) =>
  z
    .array(catalogId)
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate ids");

// Bounds are not fixed by the product docs ("bounded"); songs max 5 comes from the design.
const MAX_SEED_TAGS = 20;
const MAX_SEED_SONGS = 5;
const MAX_SEED_ARTISTS = 10;

const onboardingBody = z
  .object({
    seedTagIds: uniqueIds(MAX_SEED_TAGS).default([]),
    seedSongIds: uniqueIds(MAX_SEED_SONGS).default([]),
    seedArtistIds: uniqueIds(MAX_SEED_ARTISTS).default([]),
    sharingEnabled: z.boolean().default(false), // S09: "Not now" is the default
  })
  .strict(); // unknown fields (uid, username, shareEpoch, ...) are rejected, never ignored

// S09: POST /v1/onboarding saves taste choices and finishes setup. Needs the S05 profile.
export function onboardingRouter(completeOnboarding: CompleteOnboardingUseCase): Router {
  const router = Router();
  router.post("/onboarding", async (req, res) => {
    const body = parse(onboardingBody, req.body);
    const result = await completeOnboarding.execute({ uid: req.actor!.uid, ...body });
    // 201 for the first completion, 200 when it was already completed (nothing rewritten).
    res.status(result.created ? 201 : 200).json({ onboardingCompleted: true, requestId: req.requestId });
  });
  return router;
}
