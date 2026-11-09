# Muser — MVP Feature Specification

## 1. Overview and Goals

Muser is a mobile music application designed to help users discover, save, and stream music through personalized recommendations, swipe deck interactions, and the musical tastes of their friends.

- **Category:** Entertainment App — Music.
- **Timeline:** 1 month for MVP design, implementation, and demo verification.
- **Direction:** Compact catalog (50–100 cleared tracks), complete end-to-end user experience, tag-based recommendation engine (no complex black-box AI models required for MVP).
- **Core Experience:** Swipe-based discovery deck, multi-tier recommendation filter (Familiar Bar), friend-to-friend music sharing, and flexible personal playlist management.

---

## 2. Account, Profile, and Onboarding

- **Authentication:** Registration, login, password reset, and sign-out powered by Firebase Authentication (email and password).
- **Unique Handle (Username):**
  - Users select a unique username during initial setup.
  - Normalized to lowercase alphanumeric characters with permitted delimiters (`usernames/{normalizedUsername}`).
  - Reserved and bound transactionally via backend logic; fixed and read-only after creation for unambiguous friend discovery.
- **User Profile:**
  - Editable display name (nickname).
  - Avatar image upload and replacement from the device photo picker, persisted to Cloud Storage (`avatars/{uid}/{assetVersion}.jpg`).
  - Fallback to user initials avatar when no photo has been uploaded.
- **Onboarding Flow (Music Taste Seeding):**
  1. **Profile Setup:** Unique username and display name.
  2. **Music Types:** Genre and mood chips (`seedTagIds`) to establish baseline taste.
  3. **Favorite Songs:** Search catalog and select up to 5 favorite tracks (`seedSongIds`), with counter feedback (does not block progress if skipped or catalog is limited).
  4. **Favorite Artists:** Select preferred artists (`seedArtistIds`).
  5. **Sharing Consent:** Explains swipe-to-share mechanics; offers "Enable sharing" or "Not now" (defaults to OFF).
- **Access Boundary:** Single account role. Public profile documents (`profiles/{uid}`) expose only friend-visible identity (username, display name, avatar). Email, private settings, and listening telemetry remain strictly private.

---

## 3. Music Catalog and Playback

- **Track Metadata:** Song title, artist names (supporting collaborations), album artwork cover, duration, and standardized genre/mood tags.
- **Audio Streaming:** Stream audio tracks from authorized Cloud Storage paths or cleared external stream URLs.
- **Player Controls:** Play, pause, scrub via seek bar, replay from beginning, ±10-second seek jumps, and queue navigation (next / previous track).
- **Unified Single Audio Session:**
  - **Mini Player:** Anchored directly above the bottom navigation bar when playback originates from Playlist or Search. Retains playback state seamlessly during tab switching. Automatically hides when the Explore card deck or Full Player is active to prevent conflicting audio controls.
  - **Full Player:** Expands from the mini player with high-resolution artwork, track title, artist, full timeline scrubber, playback controls, Liked indicator, and "Add to playlist" action. Collapsing smoothly returns to the mini player without interrupting audio.
- **Playback Rules:** Only one active audio session at any time. Clear loading (buffering) indicator and error recovery states with retry and skip options.

---

## 4. Explore — Swipe-to-Discover Experience

The Explore screen serves as the default landing view after login, featuring two subtabs: **My Explore** and **My Friends**.

### 4.1. Subtab: "My Explore" (Personalized Recommendations)
- Centered card stack displaying album artwork, song title, artist, embedded playback controls, and like/skip affordances.
- **Swipe Right / Tap Heart:** Likes the track, saving it to the canonical **Liked** library (`users/{uid}/likes/{songId}`). If sharing is enabled, atomically publishes an active share record (`shares/{shareId}`) for the current privacy epoch.
- **Swipe Left / Tap Skip:** Neutral gesture to advance to the next candidate track. Does not permanently block or dislike the song.
- **Idempotency:** Swiping right on a track already in Liked does not duplicate records or silently republish historical private likes.
- **Familiar Bar Entry:** Header fire icon opens the bottom sheet selector to adjust recommendation mode.

### 4.2. Subtab: "My Friends" (Friend-Shared Discoveries)
- Card stack presenting songs shared by accepted friends who have sharing enabled.
- Displays the sharing friend's avatar and display name (e.g., *"Loved by Alex"*). If multiple friends shared the same track, attributions are consolidated into a single card rather than showing duplicate consecutive cards.
- **Swipe Right / Tap Heart:** Saves the song to the current user's Liked library. If the current user has sharing enabled, it publishes a share under the current user's name (never a forward or re-share of the friend's record).
- **Swipe Left / Tap Skip:** Advances to the next shared song.
- **Heart Reaction:** Users can tap to react with a heart to the friend's shared track. The backend atomically creates an immutable reaction record (`reactions/{reactionId}`) and writes an event into the recipient's Activity feed (`users/{recipientUid}/activity/{reactionId}`).

---

## 5. Familiar Bar and Recommendation Engine

A tag-based recommendation engine operating across three distinct modes for **My Explore**:

| Mode | Recommendation Behavior | Accent Color |
| --- | --- | --- |
| **Familiar** | Prioritizes unlistened tracks matching the user's established genre/mood tags and like history. | Lavender (`#B9A3FF`) |
| **Explore** | Combines familiar tags with adjacent genres, moods, or new artists to broaden musical horizons. | Mint Green (`#79DFC3`) |
| **Surprise** | Deliberately introduces lower-similarity tracks and unfamiliar genres outside habitual listening patterns. | Pink (`#F2A7D5`) |

- **Interaction:** Tapping the fire icon in the My Explore header opens the Familiar Bar bottom sheet. Selecting an option previews the choice; pressing "Apply" commits the mode and updates upcoming recommendations without interrupting currently playing audio.
- **Algorithm Execution:** Evaluates candidate scores against seed tags, track tags, and interaction signals (`songSignals`). For the 50–100 track catalog, scoring runs efficiently on-device or via backend callable routines.

---

## 6. Playlists and Personal Library

The **Playlist** tab manages all saved music and user collections:

### 6.1. System Playlist: "Liked"
- Canonical library containing all tracks liked by the user (via Explore swipe right, Search, or Full Player).
- Fixed at the top of the Playlist screen; cannot be deleted or renamed.
- **Unlike Action:** Unliking removes the track from Liked and deactivates any corresponding share in the friends' feed, while leaving memberships in personal custom playlists intact.

### 6.2. Personal Playlists (Custom Playlists)
- Users can **create, rename, and delete multiple custom playlists** (`playlists/{playlistId}`).
- A track may belong to multiple personal playlists and the Liked library simultaneously.
- **Organizing Songs:** Add tracks via the "Add to playlist" bottom sheet. Removing a song from a personal playlist affects only that specific playlist membership.
- **Deletion Rules:** Deleting a playlist removes only the playlist container and item mappings; tracks remain intact in the catalog and other playlists.
- **Local Search and Sort:** Filter tracks within a playlist using the local search field, and sort by *"Newest added"* (default) or *"Oldest added"*.

---

## 7. Global Search

The **Search** tab provides full-catalog exploration:

- Search across all active catalog tracks by song title or artist name.
- Input debounce prevents redundant network queries while typing.
- Result rows display album art, title, artist, and actionable controls:
  - Tap row to immediately stream the song (spawns the mini player).
  - Heart action to save to Liked (private save; does not auto-publish to friends' feeds).
  - Overflow menu / "Add to playlist" sheet to append to custom personal playlists.
- Distinct placeholder (*"Search songs or artists"*) to avoid confusion with playlist-local search (*"Search this playlist"*).

---

## 8. Friends and Relationship Management

The **Friends** tab is dedicated to managing social connections:

- **Friend List:** Displays current accepted friends with avatar, display name, and username.
- **Find Friends:** Search users by exact normalized username handle with clear pending/already-friends states.
- **Friend Requests:**
  - Incoming requests: Accept or Decline actions.
  - Outgoing requests: Displays pending status with option to cancel.
- **Safety and Integrity:** No self-requests, no duplicate pending pairs. Only the recipient may accept a request.
- **Unfriend Action:** Bidirectional removal with confirmation dialog. Unfriending immediately revokes mutual access to each other's shared tracks in the My Friends subtab.

---

## 9. Account, Settings, and Privacy

The **Account** tab oversees user identity, privacy settings, and session state:

- **Profile Overview:** Displays avatar, display name, immutable username, and email.
- **Edit Profile:** Update display name and select/upload a new avatar image from the device.
- **Privacy Controls — "Share discoveries with friends":**
  - Main switch governing whether right swipes on Explore are visible to friends.
  - **Epoch-Based Privacy (`shareEpoch`):**
    - Defaults to OFF upon account creation.
    - **When Enabled:** New right-swiped tracks in My Explore create active shares tagged with the current epoch.
    - **When Disabled:** Atomically increments `shareEpoch`, immediately hiding all past shares from friends' feeds. Liked tracks in the user's private library remain untouched.
    - **When Re-enabled:** Only newly liked tracks in the new epoch become visible to friends; historical shares from previous epochs remain permanently hidden.
- **Activity Feed:** Lists incoming heart reactions received from friends on shared music.
- **Sign Out:** Terminated authenticated session, cleans up local player state, and resets sensitive cache.

---

## 10. Navigation Shell and Screen Architecture

The app employs a 5-tab Bottom Navigation Bar in the following order:

1. **Playlist:** Liked system playlist, personal custom playlists, and playlist creation.
2. **Search:** Global catalog search by song title and artist.
3. **Explore (Default Tab):** Swipe discovery deck featuring **My Explore** and **My Friends** subtabs.
4. **Friends:** Social relationship management, username search, and friend request approvals.
5. **Account:** Profile editing, avatar upload, privacy settings, activity feed, and sign-out.

The shared Mini Player is docked above the bottom navigation bar across all applicable screens.

---

## 11. Technical Architecture and Stack

- **Mobile Framework:** **React Native + TypeScript**.
- **Audio Engine:** Background-capable streaming audio library (e.g., `react-native-track-player`).
- **Backend and Cloud Services:**
  - **Firebase Authentication:** Secure user identity and credential management.
  - **Cloud Firestore:** NoSQL database structuring profiles, friendships, catalog metadata, playlists, shares, reactions, and activity.
  - **Cloud Storage:** Binary asset repository for audio MP3 files, album covers, artist portraits, and user avatars.
- **Backend Security Boundary:**
  - Authenticated backend use cases (Cloud Functions / Firebase Callable Functions with Admin SDK) manage transactional state changes (friendships, sharing transitions, likes, heart reactions).
  - Firestore Security Rules enforce strict read/write boundaries, denying direct client writes to system-critical collections.
  - Complete separation between public profile documents (`profiles/{uid}`) and private user documents (`users/{uid}`).
- **Recommendation Implementation:** Tag-matching logic scoring candidate tracks on-device or behind a lightweight backend service.

---

## 12. Out of Scope for MVP

- Heavy custom-trained machine learning / deep learning recommendation models.
- Commercial-scale music licensing, DRM protection, and regional catalog rights management.
- Offline audio downloads and local encrypted caching.
- Direct messaging / chat between friends, comment sections, or complex social feeds.
- End-user music audio uploading (catalog is maintained exclusively by administrative seed/import).
- In-app purchases, paid subscription tiers, or commercial ad placements.

---

## 13. MVP Demo Acceptance Criteria

- [ ] User can sign up, log in, complete onboarding taste selection, and upload a custom avatar from their phone.
- [ ] Explore tab offers seamless swipe interactions:
  - **My Explore:** Right swipe likes tracks; Familiar Bar toggle visibly shifts recommendations between Familiar, Explore, and Surprise.
  - **My Friends:** Displays tracks shared by accepted friends with sharer attribution; user can send a heart reaction that creates an Activity item for the sharer.
- [ ] Playlist tab displays the Liked playlist and supports creating, renaming, deleting custom playlists, and adding/removing songs.
- [ ] Global Search returns instant catalog results with input debounce; tracks can be streamed or added to playlists directly from search results.
- [ ] Single audio player session functions reliably: Mini Player docks properly, Full Player expands smoothly, and audio persists during tab navigation.
- [ ] Two separate accounts can search each other by username, exchange friend requests, and mutually view shared music.
- [ ] Toggling sharing OFF immediately conceals all previously shared tracks from friends; toggling sharing back ON does not resurrect past shares.
- [ ] Removing a friend immediately revokes reciprocal access to each other's shared songs.
