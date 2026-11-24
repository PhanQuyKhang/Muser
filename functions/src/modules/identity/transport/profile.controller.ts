import { Router } from "express";
import { z } from "zod";
import { parse } from "../../../shared/validate";
import type { CheckUsernameUseCase } from "../application/check-username.use-case";
import type { CreateProfileUseCase } from "../application/create-profile.use-case";
import { displayNameSchema, usernameSchema } from "./identity.schemas";

const createProfileBody = z
  .object({ username: usernameSchema, displayName: displayNameSchema })
  .strict(); // unknown fields (uid, avatarPath, ...) are rejected, never ignored

const availabilityParams = z.object({ username: usernameSchema });

export function profileRouter(createProfile: CreateProfileUseCase, checkUsername: CheckUsernameUseCase): Router {
  const router = Router();

  // S05: reserve the username and create the profile.
  router.post("/me/profile", async (req, res) => {
    const body = parse(createProfileBody, req.body);
    const result = await createProfile.execute({ uid: req.actor!.uid, ...body });
    // 201 for the first creation, 200 when the same request is replayed.
    res.status(result.created ? 201 : 200).json({ profile: result.profile, requestId: req.requestId });
  });

  // Advisory availability check while the user types. The transaction above decides.
  router.get("/usernames/:username/available", async (req, res) => {
    const { username } = parse(availabilityParams, req.params);
    const { available } = await checkUsername.execute(req.actor!.uid, username);
    res.json({ username, available, requestId: req.requestId });
  });

  return router;
}
