import { db, Timestamp } from '../config/firebase';
import { ManageFriendshipInput, FriendshipDocument, FriendshipStatus } from '../types';
import { generatePairId } from '../utils/helpers';
import { AppError } from '../utils/errors';

export async function manageFriendship(uid: string, input: ManageFriendshipInput) {
  const { otherUid, action } = input;

  if (!otherUid || otherUid === uid) {
    throw new AppError('VALIDATION_ERROR', 'Cannot perform friendship action on yourself or invalid user.');
  }

  const pairId = generatePairId(uid, otherUid);
  const friendshipRef = db.collection('friendships').doc(pairId);
  const now = Timestamp.now();

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(friendshipRef);
    const existing = snap.data() as FriendshipDocument | undefined;

    switch (action) {
      case 'request': {
        if (existing) {
          if (existing.status === 'accepted') {
            throw new AppError('ALREADY_SENT', 'You are already friends.');
          }
          if (existing.status === 'pending') {
            if (existing.requesterId === uid) {
              throw new AppError('ALREADY_SENT', 'Friend request already sent.');
            } else {
              throw new AppError('INVALID_STATE', 'This user already sent you a friend request.');
            }
          }
        }

        const newDoc: FriendshipDocument = {
          memberIds: [uid, otherUid].sort() as [string, string],
          requesterId: uid,
          recipientId: otherUid,
          status: 'pending',
          requestedAt: now,
          respondedAt: null,
          updatedAt: now,
        };
        transaction.set(friendshipRef, newDoc);
        return { success: true, status: 'pending' as FriendshipStatus };
      }

      case 'accept': {
        if (!existing || existing.status !== 'pending') {
          throw new AppError('NOT_FOUND', 'No pending request found.');
        }
        if (existing.recipientId !== uid) {
          throw new AppError('FORBIDDEN', 'Only the recipient can accept a friend request.');
        }

        transaction.update(friendshipRef, {
          status: 'accepted',
          respondedAt: now,
          updatedAt: now,
        });
        return { success: true, status: 'accepted' as FriendshipStatus };
      }

      case 'decline': {
        if (!existing || existing.status !== 'pending') {
          throw new AppError('NOT_FOUND', 'No pending request found.');
        }
        if (existing.recipientId !== uid) {
          throw new AppError('FORBIDDEN', 'Only the recipient can decline a friend request.');
        }

        transaction.update(friendshipRef, {
          status: 'declined',
          respondedAt: now,
          updatedAt: now,
        });
        return { success: true, status: 'declined' as FriendshipStatus };
      }

      case 'cancel': {
        if (!existing || existing.status !== 'pending') {
          throw new AppError('NOT_FOUND', 'No pending request to cancel.');
        }
        if (existing.requesterId !== uid) {
          throw new AppError('FORBIDDEN', 'Only the requester can cancel the friend request.');
        }

        transaction.update(friendshipRef, {
          status: 'cancelled',
          respondedAt: now,
          updatedAt: now,
        });
        return { success: true, status: 'cancelled' as FriendshipStatus };
      }

      case 'remove': {
        if (!existing || existing.status !== 'accepted') {
          throw new AppError('NOT_FOUND', 'No active friendship found to remove.');
        }
        if (!existing.memberIds.includes(uid)) {
          throw new AppError('FORBIDDEN', 'Not authorized to remove this friendship.');
        }

        transaction.update(friendshipRef, {
          status: 'removed',
          updatedAt: now,
        });
        return { success: true, status: 'removed' as FriendshipStatus };
      }

      default:
        throw new AppError('VALIDATION_ERROR', `Unknown action: ${action}`);
    }
  });
}

