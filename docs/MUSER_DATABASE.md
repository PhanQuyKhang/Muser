# Muser — Firestore database design

Status: proposed implementation baseline. Latest conversation decisions take precedence over the older MUSER_FEATURES.md, which still describes an earlier MVP.

## 1. Architecture and conventions

- Mobile: React Native + TypeScript. Firebase Auth owns credentials; never store passwords in Firestore.
- One Firestore Standard database for structured data; Cloud Storage for audio, artwork and avatars.
- Proposed write boundary: app calls authenticated backend use cases for friendships, likes/shares, reactions and username registration. Backend uses transactions and checks authorization. Client can subscribe to its own Activity. This is a design proposal, not deployed infrastructure.
- Backend Admin SDK bypasses Security Rules: backend authorization is mandatory. Deny direct client writes to backend-owned collections.
- IDs are strings; relationships use IDs rather than SQL foreign keys. All dates below are Firestore Timestamp values, written using trusted server time.
- Use random IDs for events. Deterministic IDs are used only for unique memberships/lookup records. Never embed growing lists of songs, friends or reactions in one document.
- Optional fields use a consistent explicit null or omission convention in implementation. Validate field allowlists, types, enums and limits on the server.

## 2. Collection map

```text
profiles/{uid}                        Friend-visible identity, no private settings
usernames/{normalizedUsername}        Unique username reservation
users/{uid}                           Private settings and onboarding
  likes/{songId}                      Canonical Liked membership
  songSignals/{songId}                Private recommendation aggregates
  devices/{installationId}            Optional push registrations
  activity/{reactionId}               One received reaction = one row
artists/{artistId}
albums/{albumId}
songs/{songId}
tags/{tagId}
playlists/{playlistId}
  items/{songId}
friendships/{pairId}
shares/{shareId}
reactions/{reactionId}
```

Liked is a system library backed by users/{uid}/likes, not a second copy in playlists. The UI renders it beside custom playlists; it cannot be renamed or deleted. Music albums and user playlists are separate concepts.

## 3. Identity and settings

### profiles/{uid}

| Field | Type | Meaning |
| --- | --- | --- |
| username | string | Normalized unique handle; read-only in current UI |
| displayName | string | Editable nickname |
| avatarPath | string/null | Storage object path; null means initials avatar |
| status | enum | active / deleted |
| createdAt, updatedAt | Timestamp | Audit dates |

Profiles are readable by authenticated users for username search/friend identity, not public anonymous access. Public profile documents never include email, onboarding answers or sharing settings.

### usernames/{normalizedUsername}

Fields: uid:string, createdAt:Timestamp. Normalize lowercase and enforce an agreed character policy (for example a-z, 0-9, underscore and dot). Reserve username and create profile in one transaction. Do not rely on a query followed by a separate write for uniqueness.

### users/{uid}

| Field | Type | Meaning |
| --- | --- | --- |
| onboardingCompletedAt | Timestamp/null | Initial setup completion |
| seedTagIds | string[] | Bounded initial genre/mood choices |
| seedSongIds | string[] | Initial favorite songs; UI requires at least five |
| seedArtistIds | string[] | Bounded initial artist choices |
| discoveryLevel | enum | familiar / explore / surprise |
| sharingEnabled | boolean | Default false |
| shareEpoch | integer | Privacy generation; starts at zero |
| notificationPreferences | map | reactionsPush, friendRequestsPush booleans |
| activityReadThroughAt | Timestamp/null | Activity watermark for unread indication |
| createdAt, updatedAt | Timestamp | Audit dates |

Only owner/backend can read. No Music preferences editor in Account; seed choices are captured at onboarding. Firebase Auth supplies email to the owner; avoid unnecessary duplicate email fields.

Privacy generation: every true → false sharing transition increments shareEpoch atomically. Enabling does not reset it. A share is visible only if its epoch matches the current owner epoch AND sharing is enabled. This prevents old shares resurfacing on re-enable without updating every share document.

## 4. Music catalog

Catalog is writable only by trusted administration/import code. Active catalog metadata is readable by authenticated users. Metadata visibility is not proof of audio licensing.

| Collection | Fields |
| --- | --- |
| artists | name, normalizedName, imagePath?, tagIds[], status, createdAt, updatedAt |
| albums | title, normalizedTitle, artistIds[], coverPath?, releaseDate?, status, createdAt, updatedAt |
| tags | label, category: genre/mood, status |
| songs | See below |

### songs/{songId}

```ts
{
  title: "Borderline",
  normalizedTitle: "borderline",
  artistIds: ["artist_tame_impala"],
  artistNames: ["Tame Impala"],
  albumId: "album_slow_rush", // nullable for singles
  coverPath: "catalog/covers/slow-rush.jpg",
  durationMs: 237000,
  tagIds: ["genre_alternative", "mood_chill"],
  explicit: false,
  status: "active", // active | unavailable | archived
  audio: {
    storagePath: "catalog/audio/borderline.mp3",
    mimeType: "audio/mpeg",
    bitrateKbps: 128
  },
  rights: { source: "licensed-demo", attribution: "..." },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

artistIds supports collaborations; artistNames and coverPath are deliberate display duplication. Artist records remain authoritative; trusted maintenance updates copied names when renamed. Use actual cleared catalog data; this example is structural, not a license to host the named track.

Store Storage object paths, not expiring signed URLs. Playback resolves an authorized URL when needed. Tokenized public download URLs can be forwarded, so they do not enforce strict per-user audio access.

## 5. Liked and custom playlists

### users/{uid}/likes/{songId}

Fields: songId:string, likedAt:Timestamp, source:my_explore/friends/search/playlist, sourceShareId:string/null, activeShareId:string/null.

- Document existence means liked; song ID prevents duplicate membership.
- Save from My Explore while sharing is enabled can create a share atomically.
- Save from Search, playlist or My Friends stays private. A heart reaction never adds a like.
- Saving an already-liked song is a no-op: do not change likedAt or create a new share.
- Unlike deletes this membership and marks any active share inactive in one transaction. It does not remove custom playlist memberships or past reactions.
- Explicit fresh unlike → like may create a new share when eligible; enforce abuse limits separately.

### playlists/{playlistId}

Fields: ownerId:string, name:string, description:string/null, coverPath:string/null, createdAt:Timestamp, updatedAt:Timestamp.

All custom playlists are private in current product. No collaboration or playlist-publication feature is implied.

### playlists/{playlistId}/items/{songId}

Fields: songId:string, addedAt:Timestamp, position:number.

- One song may belong to many playlists and Liked simultaneously.
- Add to playlist copies membership, not the audio and not the Liked record.
- Removing a custom playlist item has no effect on likes or shares.
- position supports manual ordering if introduced; current sorting can use addedAt.
- Derive counts for the small catalog. If cached counts are later added, update atomically; do not treat an unmaintained counter as truth.
- Deleting a playlist requires deleting its items too; deleting a Firestore parent does not cascade subcollection deletion. Mark deleting first, hide it, then run retryable cleanup.

## 6. Friend requests and accepted friendships

### friendships/{pairId}

pairId is generated server-side from a collision-safe encoding/hash of two sorted UIDs. One document per unordered pair.

Fields: memberIds:string[2], requesterId:string, recipientId:string, status:pending/accepted/declined/cancelled/removed, requestedAt:Timestamp, respondedAt:Timestamp/null, updatedAt:Timestamp.

- No self-request or duplicate pending/accepted pair.
- Only recipient accepts/declines; only requester cancels; either accepted participant removes.
- Re-request uses the same pair record after an allowed cooldown, resetting request metadata. Status changes run transactionally.
- An opposite-direction request does not silently accept: return EXISTING_INCOMING_REQUEST so the UI can offer Accept.
- Only participants read the pair record. Only accepted status grants access to shares or new reactions.
- Request history is not required for current UI; optional audit events can be added separately.

## 7. Sharing and privacy

### shares/{shareId}

Fields: ownerId:string, songId:string, sharedAt:Timestamp, epoch:integer, active:boolean, deactivatedAt:Timestamp/null, deactivationReason:unliked/owner_deleted/null.

A new share is created only by an eligible new My Explore like while sharing is enabled. sharedAt belongs to this event; it is not a song-level or playlist-level field.

Backend may return a share only when ALL are true:

1. Requester and owner are accepted friends (or requester is the owner).
2. Owner has sharingEnabled=true.
3. Share epoch equals owner's current shareEpoch.
4. Share active=true and owner still has the song in Liked.
5. Owner and song are available.

Backend queries candidates from accepted friends, filters against current privacy state, merges by sharedAt and pages results with an opaque cursor. Do not expose an unrestricted shares query to the app. Firestore Rules are not post-query filters; hiding content only in UI is insufficient.

For five users, query each friend's active/current-epoch shares and merge. At scale, use a feed index/materialized candidates, but re-check live authorization before serving or reacting. Do not copy shared content permanently into recipient-readable documents and assume revocation will update it automatically.

Turning off sharing invalidates all earlier shares immediately for new server-authorized reads. Turning on does not resurrect old epochs. Already downloaded/cached content cannot be remotely erased; clear revoked feed entries when the app refreshes/receives privacy updates.

## 8. Heart reactions and Activity

Product rules: only heart; no unsend; each successfully sent reaction creates one Activity row; no grouping. Save/Like remains separate. Baseline assumes one successful heart per sender per share (the agreed Sent state); request IDs handle network retries. If repeated deliberate hearts are later approved, replace the uniqueness key with independent event IDs and retain per-request idempotency plus rate limits.

### reactions/{reactionId}

For the one-heart baseline, reactionId is a collision-safe deterministic key from shareId + senderId.

Fields: shareId:string, songId:string, senderId:string, recipientId:string, type:"heart", createdAt:Timestamp.

Backend derives recipientId and songId from the share, never trusts client-supplied recipient. It checks current share access, no self-reaction and friendship before creation. No client update/delete or unsend endpoint. Administrative/account-deletion cleanup remains possible; “no unsend” is a user action rule, not a promise to retain personal data forever.

### users/{recipientUid}/activity/{reactionId}

Fields: type:"heart_received", reactionId:string, actorId:string, shareId:string, songId:string, createdAt:Timestamp.

Create reaction and recipient Activity document in the SAME transaction. Activity is a read projection, not a second reaction event; matching IDs prevent duplicate rows. No arrays of reactors or grouped events. Only recipient/backend reads Activity; sender cannot edit/delete it.

UI resolves actor identity and catalog metadata from caches/batched reads. If a share becomes inaccessible, show “Shared song is no longer available” instead of returning private share data. History may remain, but it must not grant access to revoked shares. Marking Activity read is allowed via the private watermark; it is not an unsend.

Optional push: enqueue delivery only after commit. Push failure must not roll back the reaction. Deduplicate notifications by reactionId and honor preferences. Avoid exposing sensitive titles in lock-screen payloads by default.

## 9. Recommendation data and playback

### users/{uid}/songSignals/{songId}

Fields: songId:string, impressionCount:number, skipCount:number, playCount:number, listenedMs:number, lastSeenAt:Timestamp/null, lastPlayedAt:Timestamp/null, updatedAt:Timestamp.

These are bounded per-song aggregates, not growing event arrays. Likes are authoritative in likes, not a duplicated isLiked flag. Listening data is private; batch/debounce updates rather than writing every progress tick. Treat client telemetry as untrusted input. A future analytics pipeline can collect raw events separately with retention policies.

Current 50-song approach: fetch/cache active metadata, combine onboarding seeds, likes and signals, score in app or backend behind RecommendationService. If recommendation moves server-side, the schema need not change. Do not persist every generated queue unless cross-device queue continuity becomes a requirement.

Playback progress and queue live in player state/local storage. Optional cross-device resume can later add users/{uid}/state/player; do not write playback seconds continuously to Firestore.

### users/{uid}/devices/{installationId} (optional push)

Fields: pushProvider:fcm/expo, pushToken:string, platform:android/ios, enabled:boolean, updatedAt:Timestamp. Owner/backend only. Upsert on token changes; disable/unlink on logout; remove invalid tokens. Tokens are not public profile fields.

## 10. Query and index plan

All list operations use limits and cursor pagination, never offsets for long feeds. Confirm composite indexes against final SDK/API queries and commit index configuration with code.

| Screen/use case | Query | Candidate composite index |
| --- | --- | --- |
| My playlists | playlists ownerId == uid, order updatedAt desc | ownerId asc, updatedAt desc |
| Liked latest/oldest | user's likes order likedAt desc/asc | Single-field default |
| Playlist songs | items order addedAt desc/asc | Single-field default |
| Artist page | songs artistIds array-contains id, status == active, order title | artistIds array, status asc, title asc |
| Friends | friendships memberIds array-contains uid, status == accepted, order updatedAt desc | memberIds array, status asc, updatedAt desc |
| Incoming requests | recipientId == uid, status == pending, order requestedAt desc | recipientId asc, status asc, requestedAt desc |
| Outgoing requests | requesterId == uid, status == pending, order requestedAt desc | requesterId asc, status asc, requestedAt desc |
| Friend's share candidates | ownerId == friend, epoch == current, active == true, order sharedAt desc | ownerId asc, epoch asc, active asc, sharedAt desc |
| Activity | recipient's activity order createdAt desc | Single-field default |
| Username lookup | usernames/{normalizedUsername} document lookup | None |

Firestore does not provide arbitrary substring/full-text music search or SQL JOINs. With 50 songs, filter cached catalog locally for title/artist and playlist search. At scale, use a dedicated search index. Never promise substring search through a normalizedTitle equality query.

## 11. Backend use-case contracts

These are proposed app API operations, not existing Firebase REST endpoints. Implement as callable functions or HTTP routes consistently; verify Firebase ID token and derive uid from it.

| Operation | Input | Result / atomic work |
| --- | --- | --- |
| completeOnboarding | username, displayName, seeds, sharing choice | Reserve username, create identity/private settings |
| setSharing | enabled | Transaction on setting + epoch |
| likeSong | songId, source, sourceShareId? | Create like once; eligible share in same transaction |
| unlikeSong | songId | Delete like + deactivate linked share |
| addPlaylistSong | playlistId, songId | Owner check, unique membership |
| removePlaylistSong | playlistId, songId | Remove only membership |
| request/respond/removeFriend | otherUid, action | Validate actor and pair transition |
| getFriendDiscoveries | cursor?, limit | Live-authorized, paginated shares |
| sendHeart | shareId, requestId | Create immutable reaction + one Activity row atomically |
| getRecommendations | level, limit, cursor? | Song candidates with ranking |

Suggested stable errors: UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, INVALID_STATE, ALREADY_SENT, RATE_LIMITED, UNAVAILABLE. An already completed retry should return the existing result, not send another heart. For repeated-heart future mode, requestId must be persisted as the idempotency key.

Race handling: sendHeart reads the same friendship, share, like and owner settings documents inside its transaction, so concurrent privacy/unfriend/unlike changes invalidate/retry the operation. Validation outside a transaction alone is insufficient. If the reaction commits first, it is historical activity and is not recalled.

## 12. Access policy

| Data | Read | Write |
| --- | --- | --- |
| Catalog | Authenticated users | Catalog administration |
| Profiles / usernames | Authenticated scoped lookups | Backend profile/registration operations |
| Private user settings, likes, signals | Owner/backend | Validated owner use cases; rate-limited telemetry |
| Playlists and items | Owner/backend | Owner use cases |
| Friendships | Participants/backend | Backend state transitions |
| Shares | Authorized backend response | Backend only |
| Reactions | Authorized backend views | Backend create; no user update/delete |
| Activity | Recipient/backend | Backend creates; recipient read watermark is separate |
| Devices | Owner/backend | Owner registration/backend cleanup |

Storage rules are separate from Firestore rules. Avatar uploads must validate owner path, file size and MIME type; server-side validation/processing is needed for stronger content guarantees. Catalog upload is admin-only. App can request audio access only for available licensed songs.

Account deletion is an explicit backend workflow: revoke sessions/devices, invalidate shares, remove friendships/private data/avatars and process reaction/profile anonymization according to retention policy. Firestore has no automatic foreign-key cascade.

## 13. Storage layout

```text
catalog/audio/{songId}/{assetVersion}.mp3
catalog/covers/{albumOrSongId}/{assetVersion}.jpg
catalog/artists/{artistId}/{assetVersion}.jpg
avatars/{uid}/{assetVersion}.jpg
```

Versioned avatar replacement: upload/validate new image, commit profile path, then clean up old file. Do not delete the old avatar before the new upload succeeds.

## 14. Validation checklist for implementation

- Concurrent username reservations produce one owner.
- Duplicate saves do not duplicate likes/shares; custom membership remains independent.
- Unlike stops sharing but preserves custom playlists and historical reactions.
- Sharing off → on never revives old shares, including cached feed candidates.
- Removed friends cannot fetch shares or send new reactions.
- Concurrent/retried heart requests create one reaction and one Activity row.
- User cannot edit/delete sent reaction or create fake Activity for another user.
- No private settings or listening history leak through profile reads.
- Playlist/account deletion cleans up subcollections and Storage explicitly.
- Rules and backend authorization are tested separately; admin SDK does not exercise client Rules.

## References

- [Firestore document and collection model](https://firebase.google.com/docs/firestore/data-model)
- [Choosing a Firestore structure](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Rules and query constraints](https://firebase.google.com/docs/firestore/security/rules-query)
- [Server SDKs and Security Rules](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices)
