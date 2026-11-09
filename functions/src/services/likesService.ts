import { db, Timestamp } from '../config/firebase';
import { LikeSongInput, UnlikeSongInput, LikeDocument, ShareDocument } from '../types';
import { AppError } from '../utils/errors';

export async function likeSong(uid: string, input: LikeSongInput) {
  const { songId, source, sourceShareId } = input;
  if (!songId) {
    throw new AppError('VALIDATION_ERROR', 'Song ID is required.');
  }

  const userRef = db.collection('users').doc(uid);
  const likeRef = userRef.collection('likes').doc(songId);

  return db.runTransaction(async (transaction) => {
    const likeSnap = await transaction.get(likeRef);
    if (likeSnap.exists) {
      // Idempotency: saving an already-liked song is a no-op
      return { success: true, alreadyLiked: true };
    }

    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new AppError('NOT_FOUND', 'User profile not found.');
    }

    const userData = userSnap.data();
    const sharingEnabled = userData?.sharingEnabled ?? false;
    const shareEpoch = userData?.shareEpoch ?? 0;
    const now = Timestamp.now();

    let activeShareId: string | null = null;

    // A new share is created only by an eligible new My Explore like while sharing is enabled
    if (source === 'my_explore' && sharingEnabled) {
      const shareRef = db.collection('shares').doc();
      activeShareId = shareRef.id;

      const shareData: ShareDocument = {
        ownerId: uid,
        songId,
        sharedAt: now,
        epoch: shareEpoch,
        active: true,
        deactivatedAt: null,
        deactivationReason: null,
      };
      transaction.set(shareRef, shareData);
    }

    const likeData: LikeDocument = {
      songId,
      likedAt: now,
      source,
      sourceShareId: sourceShareId || null,
      activeShareId,
    };
    transaction.set(likeRef, likeData);

    return { success: true, activeShareId };
  });
}

export async function unlikeSong(uid: string, input: UnlikeSongInput) {
  const { songId } = input;
  if (!songId) {
    throw new AppError('VALIDATION_ERROR', 'Song ID is required.');
  }

  const userRef = db.collection('users').doc(uid);
  const likeRef = userRef.collection('likes').doc(songId);

  return db.runTransaction(async (transaction) => {
    const likeSnap = await transaction.get(likeRef);
    if (!likeSnap.exists) {
      return { success: true, wasLiked: false };
    }

    const likeData = likeSnap.data() as LikeDocument;
    const activeShareId = likeData.activeShareId;
    const now = Timestamp.now();

    // Delete canonical like
    transaction.delete(likeRef);

    // Deactivate linked share in the same transaction
    if (activeShareId) {
      const shareRef = db.collection('shares').doc(activeShareId);
      transaction.update(shareRef, {
        active: false,
        deactivatedAt: now,
        deactivationReason: 'unliked',
      });
    }

    return { success: true, wasLiked: true };
  });
}

