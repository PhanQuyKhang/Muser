import { db, Timestamp } from '../config/firebase';
import { AddPlaylistSongInput, RemovePlaylistSongInput, PlaylistItemDocument } from '../types';
import { AppError } from '../utils/errors';

export async function addPlaylistSong(uid: string, input: AddPlaylistSongInput) {
  const { playlistId, songId } = input;
  if (!playlistId || !songId) {
    throw new AppError('VALIDATION_ERROR', 'Playlist ID and Song ID are required.');
  }

  const playlistRef = db.collection('playlists').doc(playlistId);
  const itemRef = playlistRef.collection('items').doc(songId);

  return db.runTransaction(async (transaction) => {
    const playlistSnap = await transaction.get(playlistRef);
    if (!playlistSnap.exists) {
      throw new AppError('NOT_FOUND', 'Playlist not found.');
    }

    if (playlistSnap.data()?.ownerId !== uid) {
      throw new AppError('FORBIDDEN', 'You do not own this playlist.');
    }

    const itemSnap = await transaction.get(itemRef);
    if (itemSnap.exists) {
      return { success: true, alreadyAdded: true };
    }

    const now = Timestamp.now();
    const itemData: PlaylistItemDocument = {
      songId,
      addedAt: now,
      position: Date.now(),
    };

    transaction.set(itemRef, itemData);
    transaction.update(playlistRef, { updatedAt: now });

    return { success: true, alreadyAdded: false };
  });
}

export async function removePlaylistSong(uid: string, input: RemovePlaylistSongInput) {
  const { playlistId, songId } = input;
  if (!playlistId || !songId) {
    throw new AppError('VALIDATION_ERROR', 'Playlist ID and Song ID are required.');
  }

  const playlistRef = db.collection('playlists').doc(playlistId);
  const itemRef = playlistRef.collection('items').doc(songId);

  return db.runTransaction(async (transaction) => {
    const playlistSnap = await transaction.get(playlistRef);
    if (!playlistSnap.exists) {
      throw new AppError('NOT_FOUND', 'Playlist not found.');
    }

    if (playlistSnap.data()?.ownerId !== uid) {
      throw new AppError('FORBIDDEN', 'You do not own this playlist.');
    }

    transaction.delete(itemRef);
    transaction.update(playlistRef, { updatedAt: Timestamp.now() });

    return { success: true };
  });
}

