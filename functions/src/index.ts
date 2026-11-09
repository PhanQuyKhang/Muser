import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { handleServiceError } from './utils/errors';
import * as onboardingService from './services/onboardingService';
import * as privacyService from './services/privacyService';
import * as likesService from './services/likesService';
import * as playlistsService from './services/playlistsService';
import * as friendsService from './services/friendsService';
import * as sharesService from './services/sharesService';
import * as reactionsService from './services/reactionsService';
import * as recommendationsService from './services/recommendationsService';

import {
  CompleteOnboardingInput,
  SetSharingInput,
  LikeSongInput,
  UnlikeSongInput,
  AddPlaylistSongInput,
  RemovePlaylistSongInput,
  ManageFriendshipInput,
  GetFriendDiscoveriesInput,
  SendHeartInput,
  GetRecommendationsInput,
} from './types';

// Helper to enforce authenticated context
function requireAuth(authContext: { uid?: string } | undefined): string {
  if (!authContext || !authContext.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to invoke this operation.');
  }
  return authContext.uid;
}

// -----------------------------------------------------------------
// 1. Identity & Onboarding
// -----------------------------------------------------------------
export const completeOnboarding = onCall<CompleteOnboardingInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await onboardingService.completeOnboarding(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

// -----------------------------------------------------------------
// 2. Privacy & Settings
// -----------------------------------------------------------------
export const setSharing = onCall<SetSharingInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await privacyService.setSharing(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

// -----------------------------------------------------------------
// 3. Likes & Dislikes
// -----------------------------------------------------------------
export const likeSong = onCall<LikeSongInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await likesService.likeSong(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

export const unlikeSong = onCall<UnlikeSongInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await likesService.unlikeSong(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

// -----------------------------------------------------------------
// 4. Custom Playlists
// -----------------------------------------------------------------
export const addPlaylistSong = onCall<AddPlaylistSongInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await playlistsService.addPlaylistSong(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

export const removePlaylistSong = onCall<RemovePlaylistSongInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await playlistsService.removePlaylistSong(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

// -----------------------------------------------------------------
// 5. Friendships
// -----------------------------------------------------------------
export const manageFriendship = onCall<ManageFriendshipInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await friendsService.manageFriendship(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

// -----------------------------------------------------------------
// 6. Shares Feed
// -----------------------------------------------------------------
export const getFriendDiscoveries = onCall<GetFriendDiscoveriesInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await sharesService.getFriendDiscoveries(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

// -----------------------------------------------------------------
// 7. Reactions & Activity
// -----------------------------------------------------------------
export const sendHeart = onCall<SendHeartInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await reactionsService.sendHeart(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

// -----------------------------------------------------------------
// 8. Recommendations Engine
// -----------------------------------------------------------------
export const getRecommendations = onCall<GetRecommendationsInput>(async (request) => {
  try {
    const uid = requireAuth(request.auth);
    return await recommendationsService.getRecommendations(uid, request.data);
  } catch (error) {
    return handleServiceError(error);
  }
});

