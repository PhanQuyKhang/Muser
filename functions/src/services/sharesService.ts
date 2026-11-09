import { db } from '../config/firebase';
import { GetFriendDiscoveriesInput, ShareDocument } from '../types';

export async function getFriendDiscoveries(uid: string, input: GetFriendDiscoveriesInput) {
  const limit = Math.min(input.limit || 20, 50);

  // 1. Fetch all accepted friends for this user
  const friendshipsSnap = await db
    .collection('friendships')
    .where('memberIds', 'array-contains', uid)
    .where('status', '==', 'accepted')
    .get();

  if (friendshipsSnap.empty) {
    return { shares: [], nextCursor: null };
  }

  const friendUids = friendshipsSnap.docs.map((doc) => {
    const data = doc.data();
    return data.memberIds[0] === uid ? data.memberIds[1] : data.memberIds[0];
  });

  if (friendUids.length === 0) {
    return { shares: [], nextCursor: null };
  }

  // 2. Fetch friend user settings to verify sharingEnabled and live shareEpoch
  const validFriendSettings: Record<string, number> = {};
  for (const friendUid of friendUids) {
    const userDoc = await db.collection('users').doc(friendUid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (data?.sharingEnabled) {
        validFriendSettings[friendUid] = data.shareEpoch ?? 0;
      }
    }
  }

  const eligibleFriends = Object.keys(validFriendSettings);
  if (eligibleFriends.length === 0) {
    return { shares: [], nextCursor: null };
  }

  // 3. Query candidate active shares from eligible friends
  // In small scale demo, fetch friend shares and filter against live epoch & active status
  const shares: Array<ShareDocument & { id: string }> = [];

  for (const friendUid of eligibleFriends) {
    const currentEpoch = validFriendSettings[friendUid];
    const snap = await db
      .collection('shares')
      .where('ownerId', '==', friendUid)
      .where('epoch', '==', currentEpoch)
      .where('active', '==', true)
      .orderBy('sharedAt', 'desc')
      .limit(limit)
      .get();

    snap.forEach((doc) => {
      shares.push({
        id: doc.id,
        ...(doc.data() as ShareDocument),
      });
    });
  }

  // 4. Sort merged shares by sharedAt descending
  shares.sort((a, b) => b.sharedAt.toMillis() - a.sharedAt.toMillis());

  const pagedShares = shares.slice(0, limit);

  return {
    shares: pagedShares,
    nextCursor: pagedShares.length === limit ? pagedShares[pagedShares.length - 1].sharedAt.toMillis().toString() : null,
  };
}

