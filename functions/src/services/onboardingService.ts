import { db, Timestamp } from '../config/firebase';
import { CompleteOnboardingInput, ProfileDocument, UserSettingsDocument } from '../types';
import { normalizeUsername } from '../utils/helpers';
import { AppError } from '../utils/errors';

export async function completeOnboarding(uid: string, input: CompleteOnboardingInput) {
  let normalized: string;
  try {
    normalized = normalizeUsername(input.username);
  } catch {
    throw new AppError(
      'VALIDATION_ERROR',
      'Username must be 3-30 characters long and contain only lowercase letters, numbers, dots, and underscores.'
    );
  }

  if (!input.displayName || input.displayName.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Display name cannot be empty.');
  }

  const usernameRef = db.collection('usernames').doc(normalized);
  const profileRef = db.collection('profiles').doc(uid);
  const userSettingsRef = db.collection('users').doc(uid);

  await db.runTransaction(async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef);
    if (usernameSnap.exists && usernameSnap.data()?.uid !== uid) {
      throw new AppError('ALREADY_SENT', 'Username is already taken.');
    }

    const now = Timestamp.now();

    // 1. Reserve username
    transaction.set(usernameRef, {
      uid,
      createdAt: now,
    });

    // 2. Create friend-visible Profile
    const profileData: ProfileDocument = {
      username: normalized,
      displayName: input.displayName.trim(),
      avatarPath: null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    transaction.set(profileRef, profileData, { merge: true });

    // 3. Create Private User Settings
    const userSettingsData: UserSettingsDocument = {
      onboardingCompletedAt: now,
      seedTagIds: input.seedTagIds || [],
      seedSongIds: input.seedSongIds || [],
      seedArtistIds: input.seedArtistIds || [],
      discoveryLevel: 'explore',
      sharingEnabled: input.sharingEnabled ?? false,
      shareEpoch: 0,
      notificationPreferences: {
        reactionsPush: true,
        friendRequestsPush: true,
      },
      activityReadThroughAt: null,
      createdAt: now,
      updatedAt: now,
    };
    transaction.set(userSettingsRef, userSettingsData, { merge: true });
  });

  return { success: true, username: normalized };
}

