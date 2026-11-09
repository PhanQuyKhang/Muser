import { db, Timestamp } from '../config/firebase';
import { SendHeartInput, ShareDocument, ReactionDocument, ActivityDocument } from '../types';
import { generateReactionId, generatePairId } from '../utils/helpers';
import { AppError } from '../utils/errors';

export async function sendHeart(uid: string, input: SendHeartInput) {
  const { shareId } = input;
  if (!shareId) {
    throw new AppError('VALIDATION_ERROR', 'Share ID is required.');
  }

  const reactionId = generateReactionId(shareId, uid);
  const reactionRef = db.collection('reactions').doc(reactionId);
  const shareRef = db.collection('shares').doc(shareId);

  return db.runTransaction(async (transaction) => {
    // 1. Check idempotency: if already reacted, return ALREADY_SENT / success
    const reactionSnap = await transaction.get(reactionRef);
    if (reactionSnap.exists) {
      return { success: true, alreadySent: true };
    }

    // 2. Read share document
    const shareSnap = await transaction.get(shareRef);
    if (!shareSnap.exists) {
      throw new AppError('NOT_FOUND', 'Shared song not found.');
    }

    const shareData = shareSnap.data() as ShareDocument;
    const recipientId = shareData.ownerId;
    const songId = shareData.songId;

    if (recipientId === uid) {
      throw new AppError('FORBIDDEN', 'Cannot send a heart reaction to your own share.');
    }

    if (!shareData.active) {
      throw new AppError('INVALID_STATE', 'This shared song is no longer active.');
    }

    // 3. Verify friendship status inside the transaction
    const pairId = generatePairId(uid, recipientId);
    const friendshipRef = db.collection('friendships').doc(pairId);
    const friendshipSnap = await transaction.get(friendshipRef);

    if (!friendshipSnap.exists || friendshipSnap.data()?.status !== 'accepted') {
      throw new AppError('FORBIDDEN', 'You must be accepted friends to react to this share.');
    }

    // 4. Verify owner privacy epoch
    const ownerSettingsRef = db.collection('users').doc(recipientId);
    const ownerSettingsSnap = await transaction.get(ownerSettingsRef);
    if (!ownerSettingsSnap.exists) {
      throw new AppError('NOT_FOUND', 'Recipient settings not found.');
    }

    const ownerData = ownerSettingsSnap.data();
    if (!ownerData?.sharingEnabled || ownerData?.shareEpoch !== shareData.epoch) {
      throw new AppError('INVALID_STATE', 'This share is no longer accessible.');
    }

    const now = Timestamp.now();

    // 5. Create Reaction document
    const reactionData: ReactionDocument = {
      shareId,
      songId,
      senderId: uid,
      recipientId,
      type: 'heart',
      createdAt: now,
    };
    transaction.set(reactionRef, reactionData);

    // 6. Create Recipient Activity document atomically
    const activityRef = db.collection('users').doc(recipientId).collection('activity').doc(reactionId);
    const activityData: ActivityDocument = {
      type: 'heart_received',
      reactionId,
      actorId: uid,
      shareId,
      songId,
      createdAt: now,
    };
    transaction.set(activityRef, activityData);

    return { success: true, reactionId };
  });
}

