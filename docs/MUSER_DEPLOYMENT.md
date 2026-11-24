# Muser — Environments, seeding and production setup

Status: working checklist for creating the Firebase backing store. Companion to [MUSER_DATABASE.md](MUSER_DATABASE.md) and [MUSER_ARCHITECTURE.md](MUSER_ARCHITECTURE.md). Nothing here is deployed yet.

## 1. Repo layout

```text
firebase.json                    emulators + paths to rules/indexes
firebase/
  firestore.rules                client access: owner-only, read-only Activity; everything else denied
  firestore.indexes.json         composite indexes from MUSER_DATABASE.md §10
  storage.rules                  no direct audio access; artwork read; avatar staging uploads
  tests/                         rules tests (run against the emulator)
scripts/
  seed/                          catalog loader (reference vs demo) + Deezer/Last.fm enrich report
docs/
```

Firestore collections are created automatically on the first write. There is no "create collection" step: what must be provisioned is the project, region, rules, indexes and reference data.

## 2. Three kinds of data

| Kind | Examples | Emulator / dev / staging | Production |
| --- | --- | --- | --- |
| Reference | `tags` | `seed:reference` | `seed:reference` |
| Catalog | artists, albums, songs, audio | `seed:demo` (placeholder, preview-only audio) | Real licensed catalog via an approved import. **Never `seed:demo`** |
| User data | profiles, likes, playlists, shares | Created by using the app | Created by using the app, never seeded |

## 3. Local development

```bash
cd firebase/tests && npm test          # starts the emulators, runs rules tests, shuts down
```

```bash
npx firebase emulators:start --project demo-muser   # run from the repo root (install firebase-tools first)
```

With the emulator running (in another terminal):

```bash
cd scripts/seed && npm run seed
```

`FIRESTORE_EMULATOR_HOST` is detected automatically for the emulator. Seeding is idempotent: fixed IDs and `set()`, so re-running overwrites instead of duplicating.

## 4. Seed safety rules (enforced in `scripts/seed/src/seed.ts`)

- A real project needs `--env=dev|staging|prod --project=<id> --yes`; without them the script refuses.
- `--only=reference` writes tags; `--only=demo` writes artists/albums/songs; default is `all` (and `reference` for prod).
- `--env=prod` with demo data is refused, so placeholder audio paths cannot reach production.
- The whole catalog is validated first (every `tagIds`/`artistIds`/`albumId` must exist; every song needs a genre and a mood tag; `peakStartMs` must be within the song).

## 5. Production checklist (in order)

1. Create a separate Firebase project for production (dev and staging are separate projects too). **Choose the Firestore region first; it cannot be changed later.**
2. Enable Firestore (Standard), Auth providers, and Cloud Storage. Consider App Check.
3. Deploy rules and indexes: `firebase deploy --only firestore:rules,firestore:indexes,storage --project <prod-id>`. Wait for indexes to finish building.
4. Deploy the backend with least-privilege IAM. No service-account JSON in the repo; secrets go in Secret Manager.
5. Seed reference data: `npm run seed -- --env=prod --project=<prod-id> --only=reference --yes`.
6. Load the real catalog (cleared audio/artwork uploaded to Storage under `catalog/...`, metadata through the approved import).
7. Configure monitoring, cost alerts and backup/restore exercises.
8. Run the rules tests and smoke tests against staging before promoting.

## 6. Deploy tooling

- `.firebaserc` maps `dev`, `staging` and `prod` to project IDs. They are `REPLACE_WITH_*` placeholders until you create the projects; the deploy script refuses to run while a placeholder remains.
- `npm run deploy:prod` (repo root) runs the rules tests, then deploys **only** Firestore rules, indexes and Storage rules to the `prod` alias. It never writes data. `--dry-run` shows the command without deploying.
- `.github/workflows/firebase.yml` runs the rules tests and the seed validation on pull requests. A manual `workflow_dispatch` deploys to staging or prod using keyless Workload Identity Federation. Create GitHub Environments named `staging` and `prod` with required reviewers, and set these variables on each: `FIREBASE_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`.
- Reference data is seeded separately and deliberately: `cd scripts/seed && npm run seed -- --env=prod --project=<prod-id> --only=reference --yes`.

## 7. Authentication

- Provider: Firebase Authentication, email and password (MUSER_FEATURES.md). Enable the Email/Password provider in each Firebase project's console; this cannot be done from the repo.
- Backend: `functions/src/modules/identity` verifies the Firebase ID token on every `/v1` route and sets the caller from the verified `uid`. Request body, query and params are never trusted for identity. All rejections return the same `UNAUTHENTICATED` 401.
- Tests: `cd functions && npm test` starts the Auth emulator, signs up emulator users, and checks real ID tokens (valid, garbage, tampered). `npm run test:unit` runs the fake-verifier tests without the emulator.
- Setup flow: `POST /v1/me/profile` (S05) reserves the username and creates `profiles/{uid}` in one transaction; `POST /v1/onboarding` (S09) then writes `users/{uid}` (requires the profile); replays of either are no-ops. `GET /v1/me` returns `hasProfile` and `onboardingCompleted` so the app can resume an unfinished setup at S05 or S06. `GET /v1/usernames/:username/available` is an advisory check while typing. Bounds not fixed by the product docs: at most 20 seed tags, 5 songs, 10 artists; default discovery level `explore`.
- Not done yet: admin claim for catalog import, App Check, real password-reset emails (the emulator does not send them), and function region selection.

## 8. Known gaps

- Backend API, mobile app and the approved catalog import are not part of this change.
- Catalog data still lives in `scripts/seed/src/catalog.ts`; moving it to validated JSON for the import pipeline is a later step.
- Indexes follow the proposed queries in MUSER_DATABASE.md §10; re-check them against the final API queries, because the emulator does not enforce indexes.
- Demo audio paths point at files that do not exist in Storage yet (no audio has been uploaded).
