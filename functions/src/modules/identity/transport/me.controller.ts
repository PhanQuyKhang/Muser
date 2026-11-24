import { Router } from "express";
import type { GetMeUseCase } from "../application/get-me.use-case";

// GET /v1/me: the verified caller plus onboarding state. The app uses onboardingCompleted
// to decide between Explore and resuming the setup flow (S06-S09).
export function meRouter(getMe: GetMeUseCase): Router {
  const router = Router();
  router.get("/me", async (req, res) => {
    const actor = req.actor!; // set by authenticate()
    const { profile, onboardingCompleted } = await getMe.execute(actor.uid);
    res.json({
      uid: actor.uid,
      email: actor.email ?? null,
      profile,
      hasProfile: profile !== null, // false -> resume at S05; true && !onboardingCompleted -> S06
      onboardingCompleted,
      requestId: req.requestId,
    });
  });
  return router;
}
