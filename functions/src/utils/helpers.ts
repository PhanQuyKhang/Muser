import * as crypto from 'crypto';

/**
 * Normalizes username to lowercase and validates characters.
 * Enforces: a-z, 0-9, underscore and dot. Length 3-30.
 */
export function normalizeUsername(username: string): string {
  const normalized = username.trim().toLowerCase();
  const isValid = /^[a-z0-9_.]{3,30}$/.test(normalized);
  if (!isValid) {
    throw new Error('INVALID_USERNAME_FORMAT');
  }
  return normalized;
}

/**
 * Generates a deterministic, collision-safe pairId from two sorted UIDs.
 * Matches friendships/{pairId} specification in MUSER_DATABASE.md Section 6.
 */
export function generatePairId(uid1: string, uid2: string): string {
  const sorted = [uid1, uid2].sort();
  const rawKey = `${sorted[0]}_${sorted[1]}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex').substring(0, 32);
}

/**
 * Generates deterministic reactionId: shareId + senderId
 * Matches reactions/{reactionId} in MUSER_DATABASE.md Section 8.
 */
export function generateReactionId(shareId: string, senderId: string): string {
  const rawKey = `${shareId}_${senderId}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex').substring(0, 32);
}

