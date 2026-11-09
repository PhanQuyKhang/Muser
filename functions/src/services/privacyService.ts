import { db, Timestamp, FieldValue } from '../config/firebase';
import { SetSharingInput } from '../types';
import { AppError } from '../utils/errors';

export async function setSharing(uid: string, input: SetSharingInput) {
  const userRef = db.collection('users').doc(uid);

  return db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new AppError('NOT_FOUND', 'User settings not found.');
    }

    const userData = userSnap.data();
    const currentEnabled = userData?.sharingEnabled ?? false;
    const now = Timestamp.now();

    // If disabling sharing (true -> false), atomically increment shareEpoch
    if (currentEnabled && !input.enabled) {
      transaction.update(userRef, {
        sharingEnabled: false,
        shareEpoch: FieldValue.increment(1),
        updatedAt: now,
      });
      return { success: true, sharingEnabled: false };
    }

    transaction.update(userRef, {
      sharingEnabled: input.enabled,
      updatedAt: now,
    });

    return { success: true, sharingEnabled: input.enabled };
  });
}

