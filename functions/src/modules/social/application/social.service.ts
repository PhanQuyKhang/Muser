import type { Song } from "../../catalog/domain/catalog";
import type { Clock } from "../../../shared/clock";
import { AppError } from "../../../shared/errors";
import type { UnitOfWork } from "../../../shared/unit-of-work";
import {
  changeSharing,
  heartId,
  isShareVisible,
  pairId,
  type Friendship,
  type Heart,
  type Share,
  type SharingSettings,
} from "../domain/social";
import type { PublicProfile, SocialQueries, SocialRepositories } from "./ports/social-repositories";

/** The MVP lists are small; these bounds keep every read finite. */
const FRIEND_LIMIT = 100;
const SHARES_PER_FRIEND = 50;
const ACTIVITY_LIMIT = 50;

export type Relationship = "none" | "friends" | "incoming" | "outgoing" | "self";
export type RespondAction = "accept" | "decline" | "cancel";

export interface FriendEntry {
  pairId: string;
  profile: PublicProfile;
}

export interface Sharer {
  profile: PublicProfile;
  shareId: string;
  sharedAt: Date;
  heartSent: boolean;
}

export interface Discovery {
  song: Song;
  /** Newest sharer first. */
  sharers: Sharer[];
}

export interface ActivityItem {
  id: string;
  createdAt: Date;
  actor: PublicProfile | null;
  /** null once the share can no longer be shown (unliked, sharing off, unfriended). */
  song: Song | null;
}

export interface SocialDeps {
  uow: UnitOfWork<SocialRepositories>;
  queries: SocialQueries;
  songs: { getSongsByIds(ids: string[]): Promise<Map<string, Song>> };
  clock: Clock;
}

const userNotFound = () => new AppError("NOT_FOUND", "User not found");
const requestNotFound = () => new AppError("NOT_FOUND", "Friend request not found");
const shareNotFound = () => new AppError("NOT_FOUND", "Shared song not found");

export class SocialService {
  constructor(private readonly d: SocialDeps) {}

  // ------------------------------------------------------------- Friends

  /** Exact username lookup. Returns null when nobody has that username. */
  async findUser(
    uid: string,
    username: string,
  ): Promise<{ profile: PublicProfile; relationship: Relationship; pairId: string } | null> {
    const found = await this.d.queries.findUidByUsername(username);
    if (!found) return null;
    const profile = (await this.d.queries.getProfiles([found])).get(found);
    if (!profile) return null;

    const id = pairId(uid, found);
    if (found === uid) return { profile, relationship: "self", pairId: id };
    const friendship = await this.d.queries.getFriendship(id);
    let relationship: Relationship = "none";
    if (friendship?.status === "accepted") relationship = "friends";
    else if (friendship?.status === "pending") {
      relationship = friendship.requesterId === uid ? "outgoing" : "incoming";
    }
    return { profile, relationship, pairId: id };
  }

  async sendRequest(uid: string, username: string): Promise<Friendship> {
    const other = await this.d.queries.findUidByUsername(username);
    if (!other) throw userNotFound();
    if (other === uid) throw new AppError("VALIDATION_ERROR", "You cannot add yourself");
    const profiles = await this.d.queries.getProfiles([uid, other]);
    if (!profiles.has(other)) throw userNotFound();
    if (!profiles.has(uid)) throw new AppError("INVALID_STATE", "Create your profile first");

    const id = pairId(uid, other);
    const now = this.d.clock.now();
    return this.d.uow.run(async ({ friendships }) => {
      const existing = await friendships.get(id);
      if (existing?.status === "accepted") {
        throw new AppError("INVALID_STATE", "You are already friends");
      }
      if (existing?.status === "pending") {
        if (existing.requesterId === uid) return existing; // replay
        // The other person asked first: the app offers Accept instead.
        throw new AppError("INVALID_STATE", "This user already sent you a request", {
          reason: "EXISTING_INCOMING_REQUEST",
        });
      }
      const friendship: Friendship = {
        id,
        memberIds: uid < other ? [uid, other] : [other, uid],
        requesterId: uid,
        recipientId: other,
        status: "pending",
        requestedAt: now,
        respondedAt: null,
        updatedAt: now,
      };
      await friendships.save(friendship);
      return friendship;
    });
  }

  /** Only the recipient accepts or declines; only the requester cancels. */
  async respond(uid: string, id: string, action: RespondAction): Promise<Friendship> {
    const now = this.d.clock.now();
    const target = { accept: "accepted", decline: "declined", cancel: "cancelled" } as const;

    return this.d.uow.run(async ({ friendships }) => {
      const friendship = await friendships.get(id);
      if (!friendship || !friendship.memberIds.includes(uid)) throw requestNotFound();
      const actor = action === "cancel" ? friendship.requesterId : friendship.recipientId;
      if (actor !== uid) throw new AppError("FORBIDDEN", "You cannot do that to this request");
      if (friendship.status === target[action]) return friendship; // replay
      if (friendship.status !== "pending") {
        throw new AppError("INVALID_STATE", "This request is no longer pending");
      }
      const updated: Friendship = {
        ...friendship,
        status: target[action],
        respondedAt: now,
        updatedAt: now,
      };
      await friendships.save(updated);
      return updated;
    });
  }

  /** Either friend can remove. Idempotent for a participant. */
  async removeFriend(uid: string, id: string): Promise<void> {
    const now = this.d.clock.now();
    await this.d.uow.run(async ({ friendships }) => {
      const friendship = await friendships.get(id);
      if (!friendship || !friendship.memberIds.includes(uid)) {
        throw new AppError("NOT_FOUND", "Friend not found");
      }
      if (friendship.status !== "accepted") return;
      await friendships.save({ ...friendship, status: "removed", updatedAt: now });
    });
  }

  async listFriends(uid: string): Promise<FriendEntry[]> {
    return this.withProfiles(uid, await this.d.queries.listAccepted(uid, FRIEND_LIMIT));
  }

  async listRequests(uid: string): Promise<{ incoming: FriendEntry[]; outgoing: FriendEntry[] }> {
    const [incoming, outgoing] = await Promise.all([
      this.d.queries.listIncoming(uid, FRIEND_LIMIT),
      this.d.queries.listOutgoing(uid, FRIEND_LIMIT),
    ]);
    return {
      incoming: await this.withProfiles(uid, incoming),
      outgoing: await this.withProfiles(uid, outgoing),
    };
  }

  private async withProfiles(uid: string, friendships: Friendship[]): Promise<FriendEntry[]> {
    const others = friendships.map((f) => otherMember(f, uid));
    const profiles = await this.d.queries.getProfiles(others);
    return friendships.flatMap((f) => {
      const profile = profiles.get(otherMember(f, uid));
      return profile ? [{ pairId: f.id, profile }] : [];
    });
  }

  // ------------------------------------------------------------- Sharing

  getSharing(uid: string): Promise<SharingSettings> {
    return this.d.queries.getSettings(uid);
  }

  setSharing(uid: string, enabled: boolean): Promise<SharingSettings> {
    return this.d.uow.run(async ({ settings }) => {
      const current = await settings.get(uid);
      const next = changeSharing(current, enabled);
      if (next.sharingEnabled !== current.sharingEnabled) await settings.save(uid, next);
      return next;
    });
  }

  /** My Friends feed: live-authorized shares of accepted friends, one entry per song. */
  async discoveries(uid: string, limit: number): Promise<Discovery[]> {
    const friends = await this.listFriends(uid);
    const perFriend = await Promise.all(
      friends.map(async ({ profile }) => {
        const settings = await this.d.queries.getSettings(profile.uid);
        if (!settings.sharingEnabled) return [];
        const shares = await this.d.queries.listShares(
          profile.uid,
          settings.shareEpoch,
          SHARES_PER_FRIEND,
        );
        return shares
          .filter((share) => isShareVisible(share, settings))
          .map((share) => ({ share, profile }));
      }),
    );

    const rows = perFriend
      .flat()
      .sort((a, b) => b.share.sharedAt.getTime() - a.share.sharedAt.getTime());
    const songs = await this.d.songs.getSongsByIds([...new Set(rows.map((r) => r.share.songId))]);
    const sent = await this.d.queries.findHearts(rows.map((r) => heartId(r.share.id, uid)));

    const bySong = new Map<string, Discovery>();
    for (const { share, profile } of rows) {
      const song = songs.get(share.songId);
      if (!song) continue;
      const entry = bySong.get(song.id) ?? { song, sharers: [] };
      entry.sharers.push({
        profile,
        shareId: share.id,
        sharedAt: share.sharedAt,
        heartSent: sent.has(heartId(share.id, uid)),
      });
      bySong.set(song.id, entry);
    }
    return [...bySong.values()].slice(0, limit);
  }

  // ---------------------------------------------------- Hearts, Activity

  /** One heart per share and sender. Never adds the song to the sender's Liked. */
  async sendHeart(uid: string, shareId: string, requestId: string): Promise<Heart> {
    const now = this.d.clock.now();
    const id = heartId(shareId, uid);

    return this.d.uow.run(async ({ shares, friendships, settings, hearts }) => {
      // Every authorization fact is read inside the transaction (all reads before writes).
      const share = await shares.get(shareId);
      if (!share) throw shareNotFound();
      if (share.ownerId === uid) {
        throw new AppError("VALIDATION_ERROR", "You cannot react to your own song");
      }
      const [friendship, owner, existing] = await Promise.all([
        friendships.get(pairId(uid, share.ownerId)),
        settings.get(share.ownerId),
        hearts.get(id),
      ]);
      // An existing heart is no permission to reveal a share that is now private.
      if (friendship?.status !== "accepted" || !isShareVisible(share, owner)) throw shareNotFound();
      if (existing) {
        if (existing.requestId === requestId) return existing; // network retry
        throw new AppError("ALREADY_SENT", "You already sent a heart for this song");
      }
      const heart: Heart = {
        id,
        shareId,
        songId: share.songId,
        senderId: uid,
        recipientId: share.ownerId, // derived from the share, never from the client
        requestId,
        createdAt: now,
      };
      await hearts.create(heart);
      return heart;
    });
  }

  /** Hearts received. The song is hidden once the underlying share is no longer visible. */
  async activity(uid: string): Promise<ActivityItem[]> {
    const hearts = await this.d.queries.listActivity(uid, ACTIVITY_LIMIT);
    if (hearts.length === 0) return [];
    const [profiles, shares, settings, friends] = await Promise.all([
      this.d.queries.getProfiles([...new Set(hearts.map((h) => h.senderId))]),
      this.d.queries.getShares([...new Set(hearts.map((h) => h.shareId))]),
      this.d.queries.getSettings(uid),
      this.d.queries.listAccepted(uid, FRIEND_LIMIT),
    ]);
    const friendIds = new Set(friends.map((f) => otherMember(f, uid)));
    const visible = (share: Share | undefined) => !!share && isShareVisible(share, settings);
    const songs = await this.d.songs.getSongsByIds([...new Set(hearts.map((h) => h.songId))]);

    return hearts.map((heart) => ({
      id: heart.id,
      createdAt: heart.createdAt,
      actor: profiles.get(heart.senderId) ?? null,
      song:
        friendIds.has(heart.senderId) && visible(shares.get(heart.shareId))
          ? (songs.get(heart.songId) ?? null)
          : null,
    }));
  }
}

function otherMember(friendship: Friendship, uid: string): string {
  const [a, b] = friendship.memberIds;
  return a === uid ? b : a;
}
