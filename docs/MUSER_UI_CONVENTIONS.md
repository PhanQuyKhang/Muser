# Muser — Mobile UI conventions

Status: agreed rules for the `app/` package. Source of truth for visuals is the Figma file `DweSxZH3LN9Dhwt4LauObs` (MUSER); where it disagrees with the defaults in [MUSER_DESIGN.md](MUSER_DESIGN.md), **Figma wins**. Architecture context: [MUSER_ARCHITECTURE.md](MUSER_ARCHITECTURE.md) §3.

## 1. Stack

| Concern | Choice |
| --- | --- |
| Runtime | Expo (development build), React Native, TypeScript `strict` |
| Navigation | Expo Router (file-based). Route groups: `(auth)`, `(onboarding)`, `(tabs)` |
| Server state | TanStack Query |
| Client state | Zustand (session, player) |
| Auth | Firebase JS SDK, Auth only. All data goes through the `/v1` API |
| Font | Onest (400, 500, 600, 700) via `expo-font` |
| Motion / gestures | Reanimated + Gesture Handler (swipe deck) |
| Quality | ESLint, Prettier, Jest + React Native Testing Library |

## 2. Folder structure

```text
app/
  src/
    app/                   Expo Router routes only (thin: compose screens, no logic)
    features/<feature>/    screens/, components/, hooks/  (auth, onboarding, explore,
                           library, search, friends, account)
    application/           use cases (saveSong, sendHeart, ...)
    domain/                models and repository interfaces
    data/                  api client, repositories, DTO mapping
    player/                the single audio engine and store
    shared/
      theme/               design tokens (single source of truth)
      ui/                  generic components
      config/              typed env + constants
      utils/
```

Dependency direction: routes → feature screens → hooks → application → domain interfaces. `data/` implements the interfaces and is wired at startup. Features never import each other's internals; shared code goes to `shared/`.

## 3. Rules

1. **No hardcoded visual values in screens or components.** Colors, type styles, spacing and radii come from `shared/theme`.
2. **Component layers.** `shared/ui` holds generic components (Button, Input, Chip, Sheet, Avatar, Switch, Icon). Anything that knows about songs, friends or playlists is a feature component. Screens only compose.
3. **One component per folder** (`Button/Button.tsx`, `Button/index.ts`), explicit prop types, variants via props (`variant`, `size`) instead of copies.
4. **Every remote view has loading, empty and error states** (shared `Skeleton`, `EmptyState`, `ErrorState`). Never show an error as success.
5. **Accessibility by default.** 48 px minimum touch targets, `accessibilityLabel` on icon-only buttons, text respects system scaling, every swipe has a button alternative.
6. **No direct Firebase or `fetch` calls in screens.** Screen → hook → use case → repository interface.
7. **User-facing copy** (English) lives in `shared/strings`, not inline.
8. **Config** is read through one typed module (`shared/config`). Public values only, via `EXPO_PUBLIC_*`; no secrets in the app. `.env.example` is committed, real `.env.*` are not.
9. **Icons** are the Figma SVGs, rendered by one `Icon` component (`name`, `size`, `color`).
10. **Quality gate** before each commit: `typecheck`, `lint`, `test` pass. One feature per commit.

## 4. Design tokens (from Figma)

Colors: `background #101014`, `surface #1B1B23`, `surfaceElevated #272732`, `primary #B9A3FF`, `secondary #79DFC3`, `textPrimary #F4F2FA`, `textSecondary #ABA7BA`, `border #353440`, `disabled #656171`, `error #FF8A94`, `surprise #F2A7D5`, `onAccent #101014`.

| Token | Value | Figma evidence |
| --- | --- | --- |
| Page padding | 24 (20 on Explore) | Auth, Playlist frames |
| Control radius | 14 | Inputs, buttons, mini player |
| Card radius | 22 | Discovery card, Liked card |
| Row radius | 16 | Playlist rows, covers |
| Pill / circle | 20 to 24 | Buttons, chips, play button |
| Input height | 52 | Auth fields |
| Button height | 50 (primary), 48 (actions) | Log in, Skip / Like |
| Bottom navigation | 64 high, 5 equal items | All tab screens |

Type scale (Onest): hero 32/45 700, title 28/39 700, section 18/25 600, songTitle 17/24 600, body 14/20 400, label 14/20 600, field label 12/17 500, nav 12/16 500, caption 10/14 400-500, eyebrow 9/13 600.

Frame size is 390 × 844. Verify narrower screens and larger text.
