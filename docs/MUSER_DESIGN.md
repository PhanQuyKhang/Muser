# Muser — Design Guide

## 1. Purpose and status

Muser is a mobile music app for discovering, saving, and playing songs through personalized recommendations, swipe interactions, and friends' music tastes.

This guide records the agreed visual direction and provides proposed defaults for implementation. Screen layouts, spacing, and component measurements below are starting specifications to validate in Figma and on a device, not completed designs.

Related functional specification: [MUSER_FEATURES.md](./MUSER_FEATURES.md).

Scope synchronization: this design aligns with the updated [MUSER_FEATURES.md](./MUSER_FEATURES.md) and [MUSER_DATABASE.md](./MUSER_DATABASE.md), including the expanded five-tab navigation, custom playlists, global search, avatar upload, and two Explore feeds (My Explore & My Friends).

## 2. Agreed design direction

- Theme: dark.
- Interface language: English.
- Typeface: Onest throughout the app.
- Main logo color: mint green `#79DFC3`.
- Primary interaction color: lavender `#B9A3FF`.
- Keep the established palette unchanged; the mint logo does not replace lavender on primary actions.
- Personality: **modern, friendly, cool**, and focused on music discovery.
- Express this through bold artwork, generous rounded surfaces, concise conversational copy, and restrained mint/lavender accents. Keep dense controls visually organized.
- Let album artwork provide visual variety. Keep surrounding UI mostly neutral.
- The app does **not** use a ghost theme. The ghost is limited to the opening logo and the Explore navigation symbol; it must not become a mascot or decorative concept throughout the product.

## 3. Color tokens

| Token | Hex | Intended use |
| --- | --- | --- |
| `background` | `#101014` | Main screen background |
| `surface` | `#1B1B23` | Cards, bottom navigation, player surface |
| `surfaceElevated` | `#272732` | Modal, sheet, menu, selected neutral surface |
| `primary` | `#B9A3FF` | Main buttons, selected tabs, active controls |
| `secondary` | `#79DFC3` | Main logo, liked/saved state, sharing accents |
| `textPrimary` | `#F4F2FA` | Main text and important neutral icons |
| `textSecondary` | `#ABA7BA` | Artist names, supporting text, inactive icons |
| `border` | `#353440` | Subtle borders and dividers |
| `disabled` | `#656171` | Disabled controls only |
| `error` | `#FF8A94` | Errors and destructive actions |
| `surprise` | `#F2A7D5` | Surprise discovery accent |
| `onAccent` | `#101014` | Text and icons on lavender, mint, or pink fills |

### Color rules

- Use mint for the main logo, lavender for primary actions, and mint for liked/saved feedback.
- Use dark text/icons on solid accent buttons.
- Skip is a neutral action, not an error; avoid red for skipping.
- Use color with text, shape, or icon changes to communicate states.
- Use gradients sparingly, such as an onboarding illustration or a Discover hero. Do not apply gradients to every card.
- Over album art, use a scrim or a solid control surface when needed for legibility.
- Border color is decorative; do not rely on its subtle contrast alone to identify an interactive control.
- Verify contrast in final layouts: target WCAG AA, including 4.5:1 for normal text and 3:1 for large text and essential control graphics.

## 4. Logo and brand

- Main logo: mint `#79DFC3` on dark `#101014`.
- Use a single-color mark for the initial design direction.
- The user's logo depicts a ghost listening to music. Use the supplied logo artwork rather than inventing a replacement. Its precise supplied asset and app-icon composition remain to be inspected.
- Do not substitute a random music icon for an approved logo.
- Once the mark is finalized, define its clear space and minimum size using the actual artwork.
- Export the final mark as SVG for scalable use and PNG for required raster assets.
- Opening screen uses the full logo asset, named `logo_whole`. Use the actual supplied artwork when available; the asset name is a design reference, not confirmation that the file exists.
- **Logo placement restriction:** display the full ghost-listening-to-music logo only on the opening screen. Do not repeat it on login, onboarding, headers, Account, player, empty states, or other in-app screens.
- **Explore exception:** a simple ghost icon represents Explore in bottom navigation. This is a navigation glyph, not permission to reuse the full logo elsewhere.
- Do not introduce ghost illustrations, mascot reactions, floating ghosts, ghost-themed backgrounds, supernatural copy, or other ghost storytelling. Keep the rest of the app focused on music and the modern/friendly/cool direction.

## 5. Typography

Use Onest for English UI. Sizes below are logical UI units: Figma reference px and Flutter logical pixels; allow system text scaling in implementation.

| Style | Size | Line height | Weight | Usage |
| --- | --- | --- | --- | --- |
| `titleLarge` | 28 | 36 | 700 | Page title, onboarding heading |
| `titleMedium` | 20 | 28 | 600 | Section heading, player title |
| `songTitle` | 16 | 24 | 600 | Song rows and card titles |
| `body` | 16 | 24 | 400 | Descriptions, settings explanations |
| `bodySmall` | 14 | 20 | 400 | Artist names, secondary information |
| `label` | 14 | 20 | 600 | Buttons and segmented controls |
| `navigation` | 12 | 16 | 500 | Bottom navigation labels |

- Use sentence case, for example “Add friend” and “Discover music”.
- Start with default letter spacing. Avoid thin weights on dark surfaces.
- Left-align text in lists, forms, and settings.
- Truncate long song titles in compact rows; allow more space in the full player.
- Do not shrink important text to fit. Support larger text with wrapping and flexible layout.

## 6. Icons

Primary asset source: a forthcoming user-provided Figma link containing a page of icons and previously uploaded logo assets. Inspect and reuse those assets first. The link and exact page/node references have not yet been supplied.

Additional icons may be sourced if needed. Phosphor remains an optional fallback, not a mandatory replacement for the supplied set.

### Supplied asset preparation

- Inspect the icon/logo page before constructing screens; identify the full opening logo and the simple Explore ghost glyph separately.
- Reuse the supplied assets where suitable; source additional icons when the set lacks a required action.
- Supplied icons are defaults, not final styling. Adjust stroke weight, color, optical size, and alignment to match this guide.
- Normalize outlines to a consistent visual weight; start around a 2-pixel stroke on a 24-pixel icon grid and adjust optically where necessary.
- Use the palette's icon colors and state rules below, rather than retaining arbitrary source colors.
- Preserve the recognizable shape of the user's logo. Keep any stroke adjustments restrained; use mint as the agreed logo color.
- Preserve editable vector geometry where possible and avoid stretching or rasterizing icons unnecessarily.
- Create reusable icon components and state variants. Do not mix incompatible outline weights or visual styles across tabs.
- Apply the ghost placement restrictions to all downloaded, reused, and newly sourced assets.

| State or role | Color | Treatment |
| --- | --- | --- |
| Default | `#ABA7BA` | Outline |
| Selected navigation | `#B9A3FF` | Filled where available, with label |
| Important player control | `#F4F2FA` | Clear neutral symbol |
| Liked/saved | `#79DFC3` | Filled heart or saved-state symbol |
| On solid accent button | `#101014` | Dark icon |
| Disabled | `#656171` | Reduced emphasis |
| Destructive | `#FF8A94` | With explanatory label |

- Standard icon: 24 × 24.
- Supporting icon: 20 × 20 where appropriate.
- Provide at least a 48 × 48 logical-pixel touch target for interactive icons.
- Use standard vector icons rather than generated raster images for controls.
- Provide accessible names for icon-only buttons.
- Do not use the play icon as a navigation symbol if it makes the action ambiguous.

## 7. Layout foundations — proposed defaults

| Property | Default |
| --- | --- |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48 |
| Horizontal page padding | 20 |
| Gap between sections | 24–32 |
| Gap between related items | 8–12 |
| Button height | At least 48 |
| Input minimum height | 52 |
| Button/input corner radius | 12 |
| Card corner radius | 20 |
| Sheet top corner radius | 24 |
| Chip/segmented control shape | Pill |
| Border width | 1 |

- Start Figma layouts at a 390-pixel-wide reference frame and verify narrower screens.
- Use Auto Layout and flexible sizing rather than fixed screen coordinates.
- Respect status-bar, navigation-bar, and keyboard insets.
- Use surface differences and borders for hierarchy; keep shadows restrained.
- Place the mini player above bottom navigation and reserve content space for both.

## 8. Core components

### Buttons

- Primary: lavender fill, dark label, optional leading icon.
- Secondary: elevated neutral surface, primary text.
- Tertiary: text action with a sufficient touch target.
- Destructive: coral text/icon with a clear action label.
- Design default, pressed, focused, disabled, and loading states.
- Keep button width stable while showing a loading indicator.

### Inputs

- Persistent field label; placeholder provides an example, not the only label.
- Surface fill and subtle border; lavender focus indicator.
- Inline error text and error border for invalid input.
- Password field includes show/hide control.
- Username input explains its purpose for finding friends.

### Song row

- Cover image, song title, artist name, and a clearly separated action.
- Liked state uses a filled mint heart.
- Highlight the currently playing track with an additional playback indicator.
- Keep long names from overlapping controls.

### Mini player

- Cover, song title, artist, previous track, play/pause, next track, and a thin playback timeline.
- Tap the body to open the full player; play/pause remains an independent action.
- Retain playback state when switching tabs.
- Display above bottom navigation after a user starts a song from Playlist or Search.
- Use the same playback session as Explore and the full player. Never start a second independent audio player.
- Hide the mini player while the Explore card is controlling the current discovery track, and in the full-player view, to avoid duplicate controls. Restore it when leaving those views if audio remains active.
- Previous/next mean track navigation; label them differently from the card's 10-second seek actions.
- Disable unavailable previous/next actions at queue boundaries. Do not imply wraparound unless implemented.

### Discovery card

- Album artwork is the visual focus.
- Show song title, artist, and clear save/skip affordances.
- Provide button alternatives to gestures.
- Right swipe shows mint heart feedback; left swipe shows neutral skip feedback.
- Avoid showing multiple conflicting playback controls.
- Center the card in a dating-app-style discovery layout, with one active card and optionally a subtle next-card edge.
- Main content order: artwork → song title → artist → progress/timestamps → playback controls.
- Provide play/pause, replay from the beginning, rewind 10 seconds, and forward 10 seconds. Do not add a separate stop button.
- Clamp seek actions to the track's start/end. Replay seeks to the beginning and starts playback.
- Use a horizontal seek bar; dragging it or tapping a control must not trigger a card swipe.
- Place like/skip actions in a separate action area. A heart tap has the same effect as a completed right swipe.
- My Friends cards additionally show the sharing friend's avatar and display name.

### Familiar Bar

- Three labeled segments: **Familiar**, **Explore**, **Surprise**.
- Accents: lavender, mint, and pink respectively.
- Use a visible selected container or indicator; color alone must not indicate selection.
- Use a segmented selector for the MVP because there are exactly three discrete modes.
- Open the selector in a bottom sheet from a fire icon in the My Explore header. Label the entry point “Discovery level” and expose the current mode, for example “Explore”. Do not present the icon as trending music.
- The sheet includes a heading, the three choices with short explanations, and an “Apply” button.
- Selecting a choice previews selection; Apply commits it and dismisses the sheet. Dismissal without Apply preserves the previous mode.
- Apply the new mode to the next discovery selection without abruptly replacing the currently playing card.
- This setting changes My Explore recommendations only; hide its entry point in My Friends.
- Optional explanatory text:
  - Familiar: “Close to your taste.”
  - Explore: “Something new, still your vibe.”
  - Surprise: “Step outside your usual.”

### Sharing switch

- Label: “Share discoveries with friends”.
- Description: “Songs you like by swiping right will be visible to your friends.”
- Clearly distinguish on/off using thumb position and an accessible state label.
- Explain that turning sharing off hides previous shares, and turning it back on shares only new likes.

### Friend row

- Avatar or initials, display name, username, and relationship action.
- Support add, pending, accept/decline, and friends states.
- Confirm a destructive relationship action when accidental activation would be disruptive.

## 9. Navigation and detailed screens

### 9.1 App shell

Bottom navigation order: **Playlist · Search · Explore · Friends · Account**.

| Tab | Purpose | Suggested icon |
| --- | --- | --- |
| Playlist | Liked and personal playlists | Music notes/list |
| Search | Search the complete available catalog | Magnifying glass |
| Explore | Swipe through personal and friends' discoveries | Simple ghost glyph from supplied assets |
| Friends | Manage relationships and requests | Two people |
| Account | Profile, avatar, privacy, sign out | User circle |

- Explore is the default landing tab after login/setup.
- All five tabs have visible English labels. Use “Friends” consistently for the relationship tab.
- Keep tab items evenly spaced; do not make the center tab so large that it reduces other touch targets.
- Preserve each tab's navigation, search, and scroll state during tab switches where practical.
- Keep content above the navigation and mini player; neither may cover the final list item.
- Keyboard, full-screen player, and onboarding states use appropriate layouts without forcing the five-tab bar into every screen.

### 9.2 Opening

- Dark background with centered mint `logo_whole`.
- Optional motion: fade in with a small scale change; use a static version for reduced motion.
- Suggested initial animation: 400–700 ms, without an artificial delay once the app is ready.
- Restore session and route to login, unfinished onboarding, or Explore.
- Show retry feedback if initialization fails rather than leaving the logo indefinitely.

### 9.3 Authentication

- Login: welcome heading, labeled email and password fields, show/hide password, “Forgot password?”, “Log in”, and “Create account”. No ghost logo or mascot on this screen.
- Sign up: email, password, confirmation, and primary “Create account” action.
- Forgot password: email input, submission action, confirmation state, and return to login.
- Use loading and inline error states. Prevent repeated submissions while a request is running.
- Username/profile setup follows authentication; do not overload the login form.

### 9.4 Initial music setup

Present a short step flow with progress, Back, Continue, and optional Skip where applicable.

1. **Profile:** unique username and display name. Avatar can be added later in Account.
2. **Music types:** selectable genre/mood chips; explain that choices personalize discovery.
3. **Favorite songs:** searchable catalog rows, selected chips/list, and a counter such as “3/5 selected”. Suggest choosing up to five favorites, rather than requiring five before continuing.
4. **Favorite artists:** searchable artist choices with clear selected states; optional if the catalog is too limited.
5. **Sharing:** explain swipe-to-save-and-share; offer “Enable sharing” and “Not now”. Default off until opted in.

- Songs/artists must come from the available catalog; do not imply that unavailable artists can be played.
- No results should offer a way to continue, not block onboarding.
- Song selections seed preferences but do not automatically populate Liked or publish shares.
- If all optional music steps are skipped, begin with a varied starter selection.
- Music type, favorite-song, and artist selectors are used during initial setup only. Account does not offer music preference editing.

### 9.5 Explore

Header: “Explore”, followed by subtabs **My Explore** and **My Friends**. The fire entry point is visible in My Explore only.

**My Explore**

- Personalized card stack based on genre/tag preferences and liked-song feedback.
- Center card, playback controls, and clear skip/like actions.
- Show the current discovery level near the fire entry point.
- First-use hint: “Swipe right to like. Swipe left to skip.”
- Make sharing status discoverable, for example “Sharing with friends” or “Private likes”, with a route to the setting.

**My Friends**

- Same swipe/playback layout and gestures, using music shared by accepted friends.
- Include the sharer's avatar and display name, with copy such as “Loved by Alex”.
- If several friends shared a song, show a compact avatar group and names/count; present one song card rather than identical consecutive cards.
- Friend attribution means direct accepted friends, not a chain of friends-of-friends.
- No accepted friends: provide “Add friend”. No shared music: explain the empty state without inventing cards.

**Shared swipe rules**

| Action | Result |
| --- | --- |
| Right swipe / heart on a new song | Add to Liked; share as the current user if sharing is enabled |
| Left swipe / skip | Advance without permanently disliking or blocking the song |
| Right swipe on an already liked song | Keep the existing like; do not duplicate or republish an old private like |
| Cancelled/short drag | Return the current card to its original position |

- Right swipes in My Friends use the same sharing rule as My Explore. They create the current user's share, not a copy of another person's post.
- Once a swipe completes, advance the card and switch the discovery playback source. Respect the current play/pause state; never overlap audio.
- Preserve a pending save state and surface failure with retry; do not silently claim a successful save/share.
- Do not remove a like by swiping right again. Unlike is an explicit action in Liked or the track menu.

### 9.6 Playlist

Root screen: title “Playlist”, fixed **Liked** card, personal playlist list/grid, and “Create playlist”.

**Liked**

- System playlist containing songs liked through either Explore feed or an explicit like action.
- Display name: “Liked”; uppercase “LIKED” may be used as a visual cover treatment only.
- Cannot be deleted or renamed.
- Tracks can be unliked. Explain that this also removes the user's share of that song.

**Personal playlists**

- Create with a name; use a generated cover or cover collage rather than requiring a custom image upload.
- Rename and delete from an overflow menu.
- Delete confirmation explains that songs remain in the catalog and in other playlists.
- Validate blank names; preserve entered values when submission fails.

**Playlist detail**

- Back navigation, cover/title, song count, search-within-playlist input, sort control, and song rows.
- Sort options: “Newest added” (default) and “Oldest added”, based on when the track entered this playlist.
- Search filters the current playlist, not the entire catalog. Provide separate empty-playlist and no-match states.
- Tap a row to play it and show the shared mini player above bottom navigation.
- Queue starts from the current filtered/sorted list at playback initiation. Removing the playing song from a playlist does not abruptly stop audio.
- Previous/next navigate the queue; changing the search text does not unexpectedly replace an active queue.

**Organizing songs**

- “Add to playlist” opens a bottom sheet with existing personal playlists and “Create playlist”.
- A song can belong to several playlists; adding it elsewhere does not remove it from Liked.
- Prevent duplicate membership and show “Already added” where relevant.
- MVP supports relocation through Add to playlist followed by Remove from this playlist; a separate atomic Move flow is not required.

| Action | Effect |
| --- | --- |
| Remove from this playlist | Remove only that personal playlist membership |
| Unlike / Remove from Liked | Remove like and associated share; retain other playlist memberships |
| Delete playlist | Remove a personal playlist and its memberships, not catalog audio or other playlists |

Never label a normal user's action “Delete song” if it only removes a personal reference.

### 9.7 Search

- Search the entire available catalog by song title or artist name.
- Persistent search field, clear-text action, loading state, results, and no-results state.
- Rows show artwork, title, artist, and an overflow/add action.
- Tap a song to play; show the common mini player.
- “Add to playlist” chooses a personal playlist; an explicit heart action can add to Liked.
- Adding to a personal playlist does not implicitly like or share the song.
- Explicit likes from Search or a player add to Liked privately; automatic sharing is triggered by new right swipes/heart actions on Explore cards only. Use clear action labels rather than assuming every save publishes.
- A brief debounce avoids querying on every keystroke. Cancel or ignore stale responses.
- Global search and playlist-local search must have distinct placeholders: “Search songs or artists” vs “Search this playlist”.

### 9.8 Full player

- Large artwork, song title, artist, seek bar, elapsed/total time, previous track, play/pause, and next track.
- Add-to-playlist action and liked state; mint heart indicates Liked membership.
- Collapse returns to the prior screen with the mini player, without restarting audio.
- All player surfaces share one audio session and consistent position/state.
- No shuffle, repeat, lyrics, or offline controls until implemented.

### 9.9 Friends

This tab manages relationships. Music discovery through friends lives under **Explore → My Friends**.

- Show current friends with avatar, display name/nickname, and username.
- Search/add flow uses exact normalized username, with no-result and pending states.
- Requests section shows incoming requests with Accept/Decline and a count badge when applicable.
- Show outgoing pending requests; do not allow another invitation for an existing relationship.
- Remove-friend action uses confirmation and updates the relationship immediately after success.
- Removing a friend revokes mutual access to shared music, including cached UI on refresh; backend authorization must enforce the same rule.
- Prevent self-invitations, duplicate requests, and accepting someone else's request.
- No contacts permission, phone-number discovery, chat, or relationship notifications in MVP.

### 9.10 Account and settings

- Header: avatar, display name, username.
- “Edit profile”: change display name and upload/change avatar from the device photo picker. Username editing is outside the initial scope; keep it read-only after setup.
- Avatar upload flow: choose image → preview/crop if available → save; show progress, invalid-file, and retry states. Keep the previous avatar if upload fails.
- Use an initials fallback if no avatar is set or the image fails to load.
- Music preference editing is excluded from Account by user request. Keep initial music setup in onboarding.
- “Privacy”: sharing switch and a concise explanation of visibility.
- “Sign out”: end the session and clear private user views/playback from the previous account.
- Favorite songs/artists are recommendation inputs, not a public profile showcase in MVP.
- Keep backend/provider terminology out of user-facing screens.

## 9A. Sharing and ownership rules

- Private data: email, listening history, onboarding preferences, personal playlists, and private likes.
- Friend-visible data: shares created while opted in, with limited profile attribution.
- Share scope: accepted friends only, not public users.
- Turning sharing off hides and clears prior share eligibility without removing Liked membership.
- Turning sharing back on shares only new qualifying likes; it does not republish old likes.
- Unliking removes the user's share; removing a personal playlist membership does not.
- Use one underlying like per user/song and separate playlist memberships; do not infer sharing from playlist presence alone.
- Non-Explore saves are private by default as specified above. Returning to an already liked song in Explore does not silently publish it.

## 9B. Detailed Figma screen inventory

Design baseline: **22 main screens + 10 overlays/sheets = 32 base frames** after removing Account music preference editing. With approximately 8–12 representative state frames, plan for **40–44 frames**. Component variants and animation transition frames may increase the actual Figma frame count; these are not additional independent application screens. Screen IDs remain stable; S22 is retired.

### Main screens — 22

| ID | Screen | Required content |
| --- | --- | --- |
| S01 | Opening | Dark background, mint `logo_whole`, optional fade/scale transition, session routing. Full ghost/music logo appears here only. |
| S02 | Log in | Email, password, show/hide, Log in, Forgot password, Create account. No ghost logo. |
| S03 | Create account | Email, password, confirmation, Create account, return to login. |
| S04 | Reset password | Email, Send reset link, back to login; success state provided separately. |
| S05 | Set up profile | Display name, unique username, explanation of username-based friend discovery. |
| S06 | Choose music types | Genre/mood chips, selection state, progress, Back/Continue/Skip. |
| S07 | Choose favorite songs | Catalog search, song/artist rows, selection indicators, up-to-five counter, Back/Continue/Skip. Do not require five matches to proceed. |
| S08 | Choose favorite artists | Artist search, avatar/name, selected state, Back/Continue/Skip. |
| S09 | Sharing preference | Swipe-to-save/share explanation, Enable sharing, Not now. Default off. |
| S10 | Explore — My Explore | Subtabs, fire/discovery-level entry, current mode, artwork card, title/artist, timeline, play/pause, replay, ±10-second seek, skip/like, sharing status. |
| S11 | Explore — My Friends | Same card/player/swipe layout, friend avatar/name or grouped attribution. No discovery-level selector. |
| S12 | Playlist overview | Permanent Liked playlist, personal playlists, Create playlist, mini player when applicable. |
| S13 | Liked detail | Title/cover/count, search within playlist, Newest/Oldest added sort, tracks, play, Unlike, Add to playlist. No rename/delete-playlist action. |
| S14 | Personal playlist detail | Title/cover/count, local search/sort, tracks, playback, rename/delete menu, add/remove membership. One reusable layout for every personal playlist. |
| S15 | Global Search | Search songs or artists across the catalog, result rows, play, explicit like, Add to playlist; distinct from playlist-local search. |
| S16 | Full player | Large artwork, title/artist, timeline/timestamps, previous/play-pause/next, liked state, Add to playlist, collapse. |
| S17 | Friends list | Current friends' avatars, nicknames, usernames, Add friend, Requests entry, remove-friend action. |
| S18 | Find friends | Exact username search, result, Add friend, Request sent/Already friends states. |
| S19 | Friend requests | Incoming requests with Accept/Decline; outgoing requests with Pending status. |
| S20 | Account | Avatar, display name, username, email, Edit profile, Privacy, Sign out. No music preference editor. |
| S21 | Edit profile | Change nickname, choose/upload avatar, read-only username, Save, upload progress/error. |
| S23 | Privacy | Share discoveries with friends switch, current state, explanation of disabling and re-enabling sharing. |

S06–S08 remain initial-setup screens. Do not add an Account route back to these preference selectors. S22 has been removed from scope.

Mini player is a shared component, not a separate screen: place above bottom navigation with artwork/title, timeline, previous/play-pause/next, and tap-to-expand. Explore uses its card player instead of duplicate mini-player controls.

### Overlays and bottom sheets — 10

| ID | Overlay | Required content |
| --- | --- | --- |
| O01 | Discovery level | Familiar / Explore / Surprise, explanations, selected state, Apply. |
| O02 | Create playlist | Playlist name, Create, Cancel, validation. |
| O03 | Add to playlist | Personal playlists, Already added state, Create playlist entry. |
| O04 | Sort songs | Newest added / Oldest added, current selection. |
| O05 | Song actions | Contextual Add to playlist, Remove from this playlist, or Unlike; never imply catalog deletion. |
| O06 | Rename playlist | Current name, editable field, Save/Cancel. |
| O07 | Delete playlist | Confirmation; explain that catalog songs and other playlists remain. |
| O08 | Unlike song | Confirm removal from Liked and the corresponding share. |
| O09 | Remove friend | Confirm relationship removal and resulting loss of shared-music access. |
| O10 | Avatar preview | Selected image, Use photo / Choose another, upload feedback. |

The operating system's photo picker does not need a custom Figma screen. A personal playlist's overflow action menu can be a small reusable component alongside the rename/delete sheets; additional component/menu instances are not included in the 33-frame baseline.

### Representative extra states — approximately 8–12 frames

- Authentication failure and successful password-reset submission.
- Explore loading, buffering, exhausted catalog, or error.
- Card drag-left/drag-right variants for swipe prototyping.
- My Friends with no accepted friends or no shared songs.
- Empty playlist and playlist search with no matches.
- Global Search loading/no results/error.
- Username search with no match and request-pending feedback.
- Audio playback failure with Retry/Skip.
- Avatar upload failure with the previous image preserved.
- Save/share failure with Retry.

Combine representative states where sensible and use component variants rather than duplicating every screen. The 40–44 estimate is a planning range, not a requirement to draw every possible combination.

### Required end-to-end prototype flows

| Flow | Connections to demonstrate |
| --- | --- |
| First use | S01–S04 are static Opening/Auth designs in this delivery; the wired setup flow starts at S05 and continues through S09 → S10. |
| Reset password | Static reset form and success state; no prototype connection in this delivery. |
| Personal discovery | S10 → O01 → select level → Apply → S10 → swipe/heart → saved feedback; liked song appears in S13. |
| Friends' discovery | S10 → S11 → see attribution → swipe/heart → Liked and sharing according to privacy setting. |
| Playlist creation | S12 → O02 → new S14; reuse O03 for adding tracks and creating a playlist from that context. |
| Organize music | S13/S14 → O05/O03 → add elsewhere; remove only the current membership or explicitly unlike via O08. |
| Playlist playback | S13/S14 → tap track → mini player → S16 → collapse; show local search and O04 sort. |
| Global discovery by search | S15 → query → results → play/S16 or O03; saves here do not silently publish. |
| Friendship | S17 → S18 → request sent; recipient S19 → Accept → S17; remove via O09; shared music becomes available in S11 only for accepted friends. |
| Profile editing | S20 → S21 → device picker placeholder → O10 → Save → updated S20. |
| Privacy | S20 → S23 → disable sharing → S11 recipient-side state hides those shares; enable again without republishing old likes. |
| Sign out | S20 → Sign out → S02; prior user's private content/playback is cleared. |

Use distinct sample accounts and annotations for sender/recipient views. A Figma prototype simulates friendship, audio, persistence, and privacy outcomes; it does not implement the backend.

## 10. Interaction and motion

- Use short, subtle feedback; proposed duration is 150–250 ms for simple transitions.
- Swipe cards should follow the gesture and return if the gesture is cancelled.
- Confirm saved state visually without interrupting the flow with a modal.
- Keep playback progress truthful; do not animate progress as if audio were playing when paused or buffering.
- Respect reduced-motion preferences.
- Figma prototypes simulate playback, swipe outcomes, and recommendation changes using sample states. They do not perform actual streaming or backend operations.

## 11. Empty, loading, and error states

| Context | Example copy or action |
| --- | --- |
| Empty library | “Your next favorite is out there.” / “Discover music” |
| No friends | “Discover music through your friends.” / “Add friend” |
| No shared songs | “No shared discoveries yet.” |
| No username match | “No user found. Check the username.” |
| Audio error | “Couldn't play this song.” / “Retry” or “Skip” |
| Connection error | “Couldn't connect. Please try again.” / “Retry” |
| No recommendations | “No more songs right now.” / “Try another discovery level” |
| Empty personal playlist | “Make this playlist yours.” / “Find songs” |
| No search match | “No songs found. Try another title or artist.” |
| Avatar upload error | “Couldn't update your photo. Try again.” |
| Save error | “Couldn't save this song.” / “Retry” |

- Preserve usable content while refreshing where possible.
- Use skeletons for initial lists and a clear buffering state for audio.
- Do not display an error as a successful save or share.

## 12. Figma organization

Proposed pages:

1. Foundations: colors, typography, spacing, icon rules.
2. Components: buttons, inputs, song rows, cards, navigation, mini player, Familiar Bar, switches, and friend rows.
3. Screens: MVP flows and all essential states.
4. Prototype: connected flows for review.

- Use native editable text, frames, Auto Layout, components, variants, and variables.
- Use SVG for icons and vector branding; raster assets for artwork and illustration.
- Name layers by purpose and components by role/state.
- Build prototype connections for onboarding, discovery, player, saving, friends, and Account/privacy. Keep Opening/Auth static for this delivery.
- Include the expanded five-tab shell and the two Explore subtabs in screen templates.
- Add variants for playlist types (system Liked/personal), friend attribution, request state, upload state, and playback state.
- Prototype at least: setup → Explore; fire → choose level → Apply; My Friends → like; Playlist → create/add/remove/play; Search → play/add; Friends → request/accept/remove; Account → edit profile/avatar/privacy/sign out.
- Current delivery instruction: Opening and authentication screens are static designs with no outgoing prototype reactions. Account remains wired; sign-out can open the static login design.
- Keep actions consistent across prototype entry points; distinguish navigation transitions, overlays, and playback state changes.
- When the user provides the Figma link, inspect the supplied icon/logo page and record the actual file/page/node references before reusing assets. Do not assume that the link or assets have already been accessed.
- Keep the opening logo and Explore ghost icon as separate components with explicit placement notes.

## 13. Review checklist

- Palette and mint logo match the agreed colors.
- Full ghost/music logo appears only on Opening; a simple ghost navigation glyph is used only for Explore.
- No ghost mascot, decorative ghost imagery, ghost-themed copy, or ghost visual concept appears elsewhere.
- Supplied Figma icons have been normalized for stroke, color, size, and state; their default appearance is not treated as final.
- All UI text is English and uses Onest.
- Selected, saved, disabled, and error states are distinguishable.
- Swipe has accessible button alternatives.
- Primary actions remain reachable on smaller screens.
- Long song and artist names do not collide with controls.
- Larger text does not clip or hide essential actions.
- Sharing consent and current state are understandable.
- Private content is absent from unauthorized views; backend rules enforce this behavior.
- Mini player, full player, and song rows show consistent playback state.
- All essential empty, loading, and error states are designed.
- Five tabs appear in the agreed order; Explore opens by default.
- Explore has My Explore and My Friends, with working prototype routes and friend attribution.
- Liked cannot be renamed/deleted; personal playlists can be managed.
- Playlist-local search and global catalog search are distinguishable.
- Onboarding suggests up to five favorites but never blocks users because of a limited catalog.
- Gesture areas do not swallow seek-bar or playback-control input.
- Sharing rules remain consistent across new likes, duplicate likes, unlike, and toggling privacy.

## 14. Delivery priorities for one month

- Core: authentication, music setup, five-tab shell, playback, both Explore feeds, tag-based discovery levels, Liked, personal playlist management, catalog search, friend management, Account/privacy.
- Reuse: one song row, one discovery card, one audio session, one add-to-playlist sheet, and the same preference selectors for setup/editing.
- Keep avatar upload simple and catalog size small. Confirm an upload/storage solution within the project's free-tier constraints before implementation.
- Polish last: opening animation, decorative card motion, custom playlist imagery, and advanced transitions.
- Outside this revision: chat, comments, public profiles, push notifications, downloads, advanced AI, collaborative playlists, and commercial-scale streaming infrastructure.
