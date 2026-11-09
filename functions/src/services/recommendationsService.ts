import { db } from '../config/firebase';
import { GetRecommendationsInput, SongDocument } from '../types';

export async function getRecommendations(uid: string, input: GetRecommendationsInput) {
  const { level = 'explore', limit = 20 } = input;

  // 1. Fetch user's seed tags and liked songs
  const userSettingsSnap = await db.collection('users').doc(uid).get();
  const seedTagIds: string[] = userSettingsSnap.data()?.seedTagIds || [];

  const likesSnap = await db.collection('users').doc(uid).collection('likes').get();
  const likedSongIds = new Set<string>(likesSnap.docs.map((doc) => doc.id));

  // 2. Fetch active catalog songs
  const songsSnap = await db
    .collection('songs')
    .where('status', '==', 'active')
    .limit(100)
    .get();

  const candidateSongs: Array<SongDocument & { id: string; score: number }> = [];

  songsSnap.forEach((doc) => {
    const song = doc.data() as SongDocument;
    const songId = doc.id;

    // Calculate tag overlap score with user's preferred seed tags
    const songTags = song.tagIds || [];
    const overlapCount = songTags.filter((tag) => seedTagIds.includes(tag)).length;
    const tagSimilarity = songTags.length > 0 ? overlapCount / songTags.length : 0;

    let score = 0;
    switch (level) {
      case 'familiar':
        // High similarity preferred
        score = tagSimilarity * 100 - (likedSongIds.has(songId) ? 50 : 0);
        break;
      case 'explore':
        // Medium similarity / balanced exploration
        score = 50 - Math.abs(tagSimilarity - 0.5) * 50;
        break;
      case 'surprise':
        // Inverse similarity: lower match gets higher priority for discovery
        score = (1 - tagSimilarity) * 100;
        break;
    }

    candidateSongs.push({
      id: songId,
      ...song,
      score,
    });
  });

  // Sort by score descending
  candidateSongs.sort((a, b) => b.score - a.score);

  const results = candidateSongs.slice(0, limit);

  return {
    level,
    songs: results,
  };
}

