# Muser — Detailed architecture design

Status: proposed production-oriented architecture, not a statement that these components are implemented or deployed. Companion: [Firestore collection design](MUSER_DATABASE.md). Existing app/functions packages are scaffolding; this document does not change their code or dependency versions.

## 1. Main decision

Use a layered React Native/TypeScript app and a modular TypeScript backend, backed by Firebase Auth, Firestore and Cloud Storage. Keep one business codebase, not a microservice per feature. Firebase Studio is not required.

Deployment baseline: an HTTP API hosted in Cloud Functions for Firebase, with related asynchronous functions and scheduled maintenance. Handlers share modules and repository implementations. Several deployed function entry points do not imply independent domain microservices. A future Cloud Run deployment can host the same application modules if container/runtime control becomes necessary; do not operate both APIs for identical responsibilities.

```text
                       React Native + Expo development build
                       UI / use cases / repositories / player
                         |          |                |
                    ID token     HTTPS API       Audio / images
                         |          |                |
                  Firebase Auth     v                v
                           Modular backend       Cloud Storage
                           API + domain logic    (CDN when needed)
                              |       |
                         Firestore   Outbox
                              ^       |
                              |   Background delivery -> FCM
                              |
             Owner-scoped Activity realtime listener from app
```

Firebase project is the environment boundary: separate development, staging and production projects. Put compute and database close together where supported; choose location based on user latency, cost, residency and service availability before provisioning.

## 2. Explicit access boundaries

| Traffic | Route | Enforcement |
| --- | --- | --- |
| Login, reset, token refresh | App -> Firebase Auth | Firebase Auth |
| Business reads/writes | App -> API -> Firestore | API authenticates and authorizes |
| Activity live updates | App -> own Firestore Activity subcollection | Owner-only Firestore Rules |
| Media upload | App -> restricted staging Storage path | Storage Rules + backend final validation |
| Playback | App -> authorized media URL -> Storage/CDN | Media access policy and URL lifetime |
| Push | Worker -> FCM -> registered device | Backend credentials and device ownership |

Do not let UI bypass the API to mutate likes, friendships, shares or reactions. The direct Activity subscription is an intentional read-only exception hidden behind its repository. Avoid maintaining two competing write paths.

## 3. Mobile application design

Use feature folders and dependency inversion. Screen code knows use cases, not Firebase document paths.

```text
src/
  app/                     composition, navigation, startup
  features/
    auth/                  screens + session integration
    onboarding/
    explore/
    library/               Liked + custom playlists
    search/
    friends/
    activity/
    account/
  application/             saveSong, sendHeart, setSharing...
  domain/                  models, repository interfaces, pure policies
  data/
    api/                   token attachment, DTO mapping, error handling
    repositories/          concrete implementations
    realtime/              owner-scoped Activity adapter
    local/                 cache and persisted settings
  player/                  one audio engine, queue, interruption handling
  shared/                  design tokens, reusable UI, utilities
```

Dependency direction: presentation -> application -> domain interfaces. Infrastructure implements interfaces and is connected at startup. Do not import backend repository implementations into mobile code. Shared TypeScript contracts may describe API DTOs but never expose admin credentials or database internals.

State ownership:

- Server state: query cache for catalog, playlists and feed pages; invalidate after writes. Select a supported query-cache library during implementation.
- Session: Firebase Auth adapter. Never manually persist passwords; use supported auth persistence and OS-secure storage for sensitive app-managed tokens.
- Player: singleton engine and one state store. Mini player/full player observe the same state.
- UI state: component-local for sheets, swipe animation and form drafts.
- Cached server data is not authority for friendship/privacy checks.

Logout unsubscribes listeners, clears user-scoped caches, stops playback, removes device association and discards queued user mutations. Cancellation must prevent responses from the old session populating the new user's cache.

## 4. Backend module design

Each module has transport handlers, application use cases, domain policies and repositories. HTTP handlers validate input and call use cases; repositories perform persistence. No UI-specific code belongs here.

| Module | Responsibilities |
| --- | --- |
| Identity | Token verification, username reservation, profiles, onboarding, deletion |
| Catalog | Artists/albums/songs/tags, availability and approved imports |
| Library | Liked membership, custom playlists, ordering and membership |
| Social | Request/accept/decline/cancel/remove friendships |
| Sharing | Share creation, privacy generation, authorized friends feed |
| Reactions | Heart events, irreversible user action, Activity projection |
| Recommendation | Candidate selection, scoring, diversity and fallback |
| Media | Playback authorization, upload finalization, media metadata |
| Notifications | Device registrations, push preferences, outbox delivery |

Cross-module calls go through application interfaces, not HTTP calls within the same backend. A coordinator can combine Library + Sharing in one Firestore transaction. Avoid async chains for operations that must commit atomically.

### 4.1 Layer responsibilities and communication

```text
HTTP request
  -> Controller + runtime Request DTO validation
  -> Application service/use case
       -> Domain policies/models
       -> Repository interfaces inside a transaction boundary
  -> Infrastructure repository implementations -> Firestore
  -> Response DTO mapping -> HTTP response
```

| Component | Owns | Must not own |
| --- | --- | --- |
| Controller | HTTP mapping, authenticated actor context, input validation, response DTO | Business decisions or Firestore queries |
| Request/Response DTO | External API data shape; response timestamps are ISO strings | Database SDK types or privileged internal fields |
| Application service/use case | Operation sequencing, transaction boundary, invoking policies | HTTP response objects or raw Firestore access |
| Domain | Business entities, state transitions and pure policy decisions | Network calls, Firebase imports, HTTP status codes |
| Repository interface | Domain-oriented persistence contracts | Firebase-specific snapshots/references |
| Infrastructure repository | Firestore mapping, queries and transactional reads/writes | Independently redefining business policy |
| Composition root | Construct implementations and inject dependencies | Feature business logic |

Choose either a focused use-case class (SendHeartUseCase) or a cohesive application service (ReactionService). Do not introduce both as redundant pass-through wrappers. Internal modules communicate using injected interfaces and ordinary async method calls. Outbox workers handle asynchronous side effects after commit.

Domain examples: Friendship.canAccept(actorId), Share visibility policy and immutable Reaction construction. A policy receives facts loaded by repositories; it does not fetch them itself. Repository interfaces can live in domain or application ports according to which layer consumes them. Transaction orchestration interfaces belong in application.

### 4.2 Explicit TypeScript contracts

These are design-level interfaces, not implemented production source files. IDs and dates below are simplified domain primitives; input DTOs still require runtime validation because TypeScript interfaces disappear at runtime.

```ts
interface SendHeartRequestDto {
  // shareId comes from the route; actorId comes from verified authentication.
  requestId: string;
}

interface ReactionResponseDto {
  id: string;
  shareId: string;
  type: "heart";
  createdAt: string; // ISO 8601; never a Firestore Timestamp in an API DTO
}

interface Reaction {
  id: string;
  shareId: string;
  songId: string;
  senderId: string;
  recipientId: string;
  type: "heart";
  createdAt: Date;
}

interface HeartAuthorizationFacts {
  acceptedFriends: boolean;
  sharingEnabled: boolean;
  ownerEpoch: number;
  shareEpoch: number;
  shareActive: boolean;
  ownerStillLikesSong: boolean;
  ownerActive: boolean;
  songAvailable: boolean;
}

interface ReactionRepository {
  findById(id: string): Promise<Reaction | null>;
  create(reaction: Reaction): Promise<void>;
  // Intentionally no user-facing update/delete operation.
}

interface ShareReactionContext {
  shareId: string;
  songId: string;
  ownerId: string;
  facts: HeartAuthorizationFacts;
}

interface SharingRepository {
  loadReactionContext(
    actorId: string,
    shareId: string,
  ): Promise<ShareReactionContext | null>;
}

interface ActivityRepository {
  createHeartReceived(reaction: Reaction): Promise<void>;
}

interface OutboxRepository {
  enqueueHeartNotification(reaction: Reaction): Promise<void>;
}

interface ReactionTransactionRepositories {
  reactions: ReactionRepository;
  sharing: SharingRepository;
  activity: ActivityRepository;
  outbox: OutboxRepository;
}

interface UnitOfWork {
  run<T>(
    work: (repos: ReactionTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}

interface Clock {
  now(): Date;
}

interface RecommendationQuery {
  userId: string;
  level: "familiar" | "explore" | "surprise";
  limit: number;
  cursor?: string;
}

interface RecommendationProvider {
  recommend(query: RecommendationQuery): Promise<{
    songIds: string[];
    algorithmVersion: string;
    nextCursor: string | null;
  }>;
}

interface PlaybackUrlProvider {
  issue(songId: string, actorId: string): Promise<{
    url: string;
    expiresAt: Date;
  }>;
}
```

FirestoreUnitOfWork constructs transaction-bound repository implementations, hiding the SDK transaction object. Every authorization fact is read through those bound repositories. All reads, including duplicate-reaction lookup, occur before writes; Firestore transactions require this ordering. Application/domain decisions are re-evaluated if the transaction retries. Generate a stable operation/reaction identity outside the retry callback; never send push or perform irreversible external side effects inside it.

SendHeartUseCase sequence inside UnitOfWork.run:

1. Load existing reaction and current share authorization facts.
2. Check the domain policy for current access and self-reaction prohibition. An existing reaction is not permission to expose a now-private share.
3. If the same valid send already succeeded, return its existing result without additional writes.
4. Construct Reaction; create reaction, Activity and outbox records using matching stable IDs.
5. Commit, then map the domain result into ReactionResponseDto outside the persistence layer.

Each other module defines similarly focused ports: PlaylistRepository, LikeRepository, FriendshipRepository, ProfileRepository, CatalogRepository and UserSettingsRepository. Add methods required by real use cases rather than a generic BaseRepository CRUD abstraction. Read-heavy feed/search ports may return query projections instead of reconstructing domain entities unnecessarily.

### 4.3 Example backend folder structure

```text
src/
  bootstrap/                         dependency construction and HTTP setup
  modules/reactions/
    transport/
      reaction.controller.ts
      dto/send-heart.request.ts
      dto/reaction.response.ts
    application/
      send-heart.use-case.ts
      ports/unit-of-work.ts
      ports/outbox.repository.ts
    domain/
      reaction.ts
      heart.policy.ts
      reaction.repository.ts
    infrastructure/
      firestore-reaction.repository.ts
      reaction.mapper.ts
  modules/                           other feature modules follow same pattern
  infrastructure/firestore/
    firestore-unit-of-work.ts
  workers/                           outbox processors and maintenance jobs
  shared/                            small shared primitives, not a business-code dumping ground
```

Controllers and repositories are concrete classes/adapters where useful; not every class needs a redundant interface. Define interfaces at substitution boundaries: persistence, transaction execution, recommendation, media signing, clock and external delivery. Unit tests inject fakes; integration tests verify real adapters. This layout does not require NestJS or another specific backend framework.

## 5. Core invariants

- Liked is users/{uid}/likes; custom playlists hold independent memberships.
- Adding a liked song to another playlist leaves it in Liked. Unlike does not delete custom memberships.
- My Explore right swipe creates Liked membership; only an eligible new swipe while sharing is enabled creates a share.
- Search or My Friends saves do not automatically re-share.
- A heart targets one person's share, never the global song; it does not save music.
- Only heart is supported. User cannot unsend/update/delete it. One successful event means one Activity row, not a grouped row.
- Baseline is one heart per sender per share, matching the earlier Sent state. Repeated intentional hearts remain a separate product decision; network retries must never create additional events in either design.
- Accepted friendship and current sharing authorization are required to view a share or send a new heart.

Sharing uses sharingEnabled plus shareEpoch on the owner settings. Turning sharing off increments the epoch. Existing shares keep their earlier epoch; turning on does not revive them. Unlike deactivates the relevant share. Feed caches cannot overrule these checks.

## 6. Authentication and authorization flow

1. App authenticates with Firebase Auth and receives an ID token through the SDK.
2. API request includes Authorization: Bearer <ID token>.
3. Middleware verifies token signature, project and expiry with Firebase Admin SDK; derives uid from verified claims, never from request-body ownerId.
4. Use case checks object ownership, friendship, account status and operation-specific policies.
5. Repository performs transaction/read/write; response returns a public DTO.

On token expiry, refresh once through Auth SDK and retry eligible requests. Do not retry forbidden operations as if they were network failures. Sensitive operations may require recent login/revocation checks.

Admin SDK bypasses Firestore Security Rules. API authorization is therefore mandatory. Rules still protect the direct Activity listener and any explicitly allowed Storage/client operation. Firebase App Check can add abuse resistance; it does not replace user authentication or authorization.

## 7. API outline

Version business API under /v1; publish OpenAPI contracts with input/output schemas, stable error codes, pagination and auth requirements. These are proposed routes, not Firebase-provided REST endpoints.

| Method and route | Purpose |
| --- | --- |
| POST /v1/onboarding | Reserve username and complete profile/settings |
| GET /v1/catalog/tags | Active genre/mood tags; optional `category` filter |
| GET /v1/catalog/songs | Paged catalog; `limit` (max 50), `cursor`, and one of `tagId` / `artistId` |
| GET /v1/catalog/songs/:songId | One active song (no storage path or rights data) |
| GET /v1/artists/:id | Artist details and songs |
| GET /v1/search | Catalog search; cached filtering is adequate for initial catalog |
| GET /v1/me/likes | Liked library |
| PUT /v1/me/likes/:songId | Idempotent save, source metadata |
| DELETE /v1/me/likes/:songId | Unlike and deactivate share |
| POST /v1/playlists | Create custom playlist |
| PATCH /v1/playlists/:id | Rename/update owner playlist |
| DELETE /v1/playlists/:id | Mark deleting and clean descendants |
| PUT/DELETE /v1/playlists/:id/items/:songId | Add/remove membership |
| POST /v1/friend-requests | Send request |
| POST /v1/friend-requests/:pairId/respond | Accept/decline/cancel with actor validation |
| DELETE /v1/friendships/:pairId | Remove friendship |
| GET /v1/friends/discoveries | Authorized paginated share feed |
| PATCH /v1/me/sharing | Enable/disable with privacy epoch |
| POST /v1/shares/:shareId/hearts | Send heart with Idempotency-Key |
| GET /v1/me/activity | Paginated history; live head via owner listener |
| POST /v1/me/activity/read | Server-controlled read watermark |
| GET /v1/recommendations | level, limit, cursor |
| POST /v1/media/:songId/playback | Check availability and issue playback descriptor |
| POST /v1/me/avatar/finalize | Validate staging upload and publish avatar |

Responses include requestId for diagnosis. Errors use {error:{code,message,details?},requestId}. Typical HTTP mappings: 400 validation, 401 unauthenticated, 403 forbidden, 404 unavailable/not found, 409 invalid state, 429 rate limited, 503 temporary failure. Avoid revealing private object existence to unauthorized callers.

Use cursor pagination with deterministic tie-breakers and maximum page sizes. An authorized merge feed cursor must preserve per-source progress, not merely the last item timestamp. At scale materialize candidates and still re-check access on response.

## 8. Main operation sequences

### Right swipe

App animates card -> save use case -> API transaction reads current user/like -> validates source and song -> creates unique like -> optionally creates share and links it -> commits -> returns saved/shared flags. UI reflects server-confirmed outcome and reconciles failed optimistic saves. Already-liked saves return existing state without new shares.

### Send heart

App shows Sending -> API transaction reads share, owner settings, owner like and friendship -> checks current access -> creates unique reaction + recipient Activity + notification outbox event -> commits -> UI shows Sent. No unsend endpoint. Backend derives recipient from share, never accepts arbitrary recipient from app.

The transaction reads the documents whose concurrent changes revoke authorization, so unfriend/unlike/privacy edits trigger conflict retries. A heart committed before revocation remains historical activity, but cannot grant access to the revoked share.

### Privacy off

API transaction sets sharingEnabled=false and increments epoch -> future feed/heart requests fail visibility checks -> app clears related cached feed cards on refresh/privacy invalidation. Already downloaded bytes cannot be remotely erased. Enabling later leaves the epoch unchanged; only new eligible shares become visible.

### Playback

Player requests descriptor -> backend checks catalog availability/entitlement -> returns URL, expiry if applicable and metadata -> player streams directly from Storage/CDN. Player owns buffering, seek, next/back, interruptions and lock-screen controls. The API does not proxy the audio stream.

Signed URLs remain usable until expiry and are not DRM. Select lifetime to balance revocation and uninterrupted playback; refresh gracefully on expiry. Range requests/seek, MIME types and cache behavior must be verified against the chosen media endpoint. Commercial music rights may require a licensed streaming provider/DRM pipeline instead of ordinary file URLs.

## 9. Recommendation design

Start backend-side with tag/artist scoring, onboarding seeds and aggregated listening signals. Pipeline: candidates -> unavailable/blocked exclusions -> relevance -> novelty/diversity re-ranking -> stable shuffled queue -> fallback.

Familiar emphasizes known interests, Explore balances familiarity and novelty, Surprise increases novelty while retaining basic relevance. Keep weights configuration-driven and record algorithmVersion with responses/telemetry. No claim of trained AI is needed.

Telemetry is private and untrusted: validate increments, batch events, deduplicate event IDs and cap anomalous values. Never write Firestore every playback second. For 50 songs rank the active catalog in memory; larger catalogs can move to search/vector indexes and asynchronous feature computation without changing the app API.

## 10. Async processing and reliability

Add backend-only outbox/{eventId} to the schema: eventType, aggregateId, recipientId, createdAt, status, attempts, nextAttemptAt and processing lease. Create it inside the business transaction. A trigger/worker processes pending events; a periodic recovery job catches abandoned work.

Delivery can repeat and arrive out of order. Handlers must be idempotent, with retry/backoff, attempt limits and dead-letter investigation. Push is best-effort: a crash between FCM accepting a message and marking delivery can cause a repeat; collapse/dedup identifiers reduce visible duplication but do not promise exactly-once push. Firestore reaction/Activity creation remains logically once through deterministic IDs/transactions.

Use scheduled jobs for deleted-playlist descendants, account deletion, stale devices and abandoned avatar uploads. Keep logical content availability separate from eventual physical file deletion.

## 11. Cache and offline behavior

Cache catalog metadata and the user's library locally; display last-known content with clear offline feedback. Firestore direct-listener caching is not a general cache for API responses; implement API cache persistence explicitly if required.

Reaction sending requires connectivity: show failure/retry, never silently send hours later. Library edits may use an explicit persisted queue with stable idempotency keys, per-user isolation and reconciliation. Friendship/privacy operations require server confirmation. Clear revoked share views, user caches and listener subscriptions promptly on logout/account changes.

Do not treat streaming buffer/cache as licensed offline downloads. No persistent audio download feature unless explicitly authorized and designed.

## 12. Operations, tests and proposed targets

- CI: typecheck/lint, unit tests for policies/ranking, API integration tests with Firebase emulators, Rules tests for direct accesses, build artifact and smoke tests.
- Test races: duplicate username claim, reaction retry, privacy vs sendHeart, opposite friend requests, duplicate saves and upload failure.
- Use structured logs with requestId and operation name; redact tokens, private profiles and audio URLs. Track error rates, API latency, transaction retries, playback startup/buffering and push backlog.
- Configure backups/restore exercises, cost alerts and usage monitoring. Alerts are not a universal spending cap. Bound pagination, write frequency, request size and compute instances.
- Managed service identities/least-privilege IAM; no service-account JSON in app/repo. Keep third-party secrets in Secret Manager. Rate-limit by verified user and abuse signals using shared infrastructure, not only process memory.
- Proposed staging acceptance targets, to validate rather than claim: metadata API p95 <= 800 ms excluding cold starts; heart commit p95 <= 1 s; first audio <= 3 s on defined stable Wi-Fi/test assets; loading/empty/error states on all remote views. Measure cold-start performance separately.

## 13. Evolution without premature complexity

1. Implement modular backend, Firestore transactions, Storage playback and owner Activity subscription.
2. Add observability, outbox recovery, secure upload pipeline and production authorization tests before launch.
3. Introduce dedicated search, CDN configuration and feed materialization only when measured needs justify them.
4. Extract Recommendation or media processing into separately deployed services when independent scale/runtime/team ownership demands it. Preserve app API contracts; avoid a database per module merely for appearance.

## References

- [Firebase ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firestore Rules and server SDK bypass](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore event delivery and ordering](https://firebase.google.com/docs/functions/firestore-events)
- [Cloud Run deployment model](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run)
