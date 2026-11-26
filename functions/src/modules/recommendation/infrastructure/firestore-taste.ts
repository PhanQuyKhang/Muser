import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { DEFAULT_DISCOVERY_LEVEL, type DiscoveryLevel } from "../../identity/domain/identity";
import type { RecommendationDeps, TasteProfile } from "../application/recommendation.service";

const LIKES_LIMIT = 500;

export class FirestoreTasteRepository implements Pick<RecommendationDeps["tastes"], "getTaste" | "saveLevel"> {
  constructor(private readonly db: Firestore) {}

  async getTaste(uid: string): Promise<TasteProfile> {
    const [user, likes] = await Promise.all([
      this.db.doc(`users/${uid}`).get(),
      this.db.collection(`users/${uid}/likes`).limit(LIKES_LIMIT).get(),
    ]);
    return {
      seedTagIds: user.get("seedTagIds") ?? [],
      seedSongIds: user.get("seedSongIds") ?? [],
      seedArtistIds: user.get("seedArtistIds") ?? [],
      likedSongIds: likes.docs.map((d) => d.id),
      discoveryLevel: user.get("discoveryLevel") ?? DEFAULT_DISCOVERY_LEVEL,
    };
  }

  async saveLevel(uid: string, level: DiscoveryLevel): Promise<void> {
    await this.db
      .doc(`users/${uid}`)
      .set({ discoveryLevel: level, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
}
