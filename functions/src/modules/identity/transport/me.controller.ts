import { Router } from "express";

// GET /v1/me: returns the verified caller. Profile data joins here once onboarding exists.
export function meRouter(): Router {
  const router = Router();
  router.get("/me", (req, res) => {
    const actor = req.actor!; // set by authenticate()
    res.json({ uid: actor.uid, email: actor.email ?? null, requestId: req.requestId });
  });
  return router;
}
