import { Router } from "express";
import { z } from "zod";
import { toSongDto } from "../../catalog/transport/catalog.dto";
import { parse } from "../../../shared/validate";
import type { SocialService } from "../application/social.service";
import type { Friendship } from "../domain/social";

// IDs become Firestore document IDs, so reject anything that could alter the path.
const id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, "Invalid id");
const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.]{3,20}$/, "Invalid username");

const usernameQuery = z.object({ username });
const requestBody = z.object({ username }).strict();
const respondBody = z.object({ action: z.enum(["accept", "decline", "cancel"]) }).strict();
const pairParams = z.object({ pairId: id });
const shareParams = z.object({ shareId: id });
const heartBody = z.object({ requestId: id }).strict();
const sharingBody = z.object({ enabled: z.boolean() }).strict();
const feedQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(30) });

const toFriendshipDto = (f: Friendship) => ({
  pairId: f.id,
  status: f.status,
  requestedAt: f.requestedAt.toISOString(),
});

export function socialRouter(social: SocialService): Router {
  const router = Router();

  // ---- Friends ----

  router.get("/users/search", async (req, res) => {
    const query = parse(usernameQuery, req.query);
    const user = await social.findUser(req.actor!.uid, query.username);
    res.json({ user, requestId: req.requestId });
  });

  router.get("/friends", async (req, res) => {
    const items = await social.listFriends(req.actor!.uid);
    res.json({ items, requestId: req.requestId });
  });

  router.get("/friend-requests", async (req, res) => {
    const requests = await social.listRequests(req.actor!.uid);
    res.json({ ...requests, requestId: req.requestId });
  });

  router.post("/friend-requests", async (req, res) => {
    const body = parse(requestBody, req.body);
    const friendship = await social.sendRequest(req.actor!.uid, body.username);
    res.status(201).json({ ...toFriendshipDto(friendship), requestId: req.requestId });
  });

  router.post("/friend-requests/:pairId/respond", async (req, res) => {
    const { pairId } = parse(pairParams, req.params);
    const { action } = parse(respondBody, req.body);
    const friendship = await social.respond(req.actor!.uid, pairId, action);
    res.json({ ...toFriendshipDto(friendship), requestId: req.requestId });
  });

  router.delete("/friendships/:pairId", async (req, res) => {
    const { pairId } = parse(pairParams, req.params);
    await social.removeFriend(req.actor!.uid, pairId);
    res.status(204).end();
  });

  // ---- Sharing ----

  router.get("/me/sharing", async (req, res) => {
    const settings = await social.getSharing(req.actor!.uid);
    res.json({
      enabled: settings.sharingEnabled,
      epoch: settings.shareEpoch,
      requestId: req.requestId,
    });
  });

  router.patch("/me/sharing", async (req, res) => {
    const { enabled } = parse(sharingBody, req.body);
    const settings = await social.setSharing(req.actor!.uid, enabled);
    res.json({
      enabled: settings.sharingEnabled,
      epoch: settings.shareEpoch,
      requestId: req.requestId,
    });
  });

  router.get("/friends/discoveries", async (req, res) => {
    const { limit } = parse(feedQuery, req.query);
    const discoveries = await social.discoveries(req.actor!.uid, limit);
    res.json({
      items: discoveries.map(({ song, sharers }) => ({
        song: toSongDto(song),
        sharers: sharers.map((s) => ({
          ...s.profile,
          shareId: s.shareId,
          sharedAt: s.sharedAt.toISOString(),
          heartSent: s.heartSent,
        })),
      })),
      nextCursor: null,
      requestId: req.requestId,
    });
  });

  // ---- Hearts and Activity ----

  router.post("/shares/:shareId/hearts", async (req, res) => {
    const { shareId } = parse(shareParams, req.params);
    const body = parse(heartBody, req.body);
    const heart = await social.sendHeart(req.actor!.uid, shareId, body.requestId);
    res.status(201).json({
      id: heart.id,
      shareId: heart.shareId,
      type: "heart",
      createdAt: heart.createdAt.toISOString(),
      requestId: req.requestId,
    });
  });

  router.get("/me/activity", async (req, res) => {
    const items = await social.activity(req.actor!.uid);
    res.json({
      items: items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        actor: item.actor,
        song: item.song ? toSongDto(item.song) : null,
      })),
      nextCursor: null,
      requestId: req.requestId,
    });
  });

  return router;
}
