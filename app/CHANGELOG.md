# @playlistwizard/app

## 3.16.1

### Patch Changes

- feat: remove Spotify support ([#323](https://github.com/suzuki3jp/PlaylistWizard/pull/323))

  - `@playlistwizard/core`: remove "spotify" from `provider` enum in `StructuredPlaylistsDefinitionSchema` (breaking change)
  - `@playlistwizard/app`: remove Spotify sign-in and account linking

- fix: unify product name from "Playlist Wizard" to "PlaylistWizard" across all user-visible text ([#324](https://github.com/suzuki3jp/PlaylistWizard/pull/324))
- fix: update FAQ privacy answer, account disconnect description, and sign-in page text ([#325](https://github.com/suzuki3jp/PlaylistWizard/pull/325))
- Updated dependencies:
  - `@playlistwizard/core@1.0.0`

## 3.16.0

### Minor Changes

- feat: add settings page with linked accounts management ([#320](https://github.com/suzuki3jp/PlaylistWizard/pull/320))

  Users can now manage their linked OAuth accounts (Google, Spotify) from the new Settings page. Features include profile avatar display, linking additional accounts (including multiple accounts per provider), and disconnecting individual accounts.

## 3.15.0

### Minor Changes

- feat: introduced a sidebar for easier navigation ([#309](https://github.com/suzuki3jp/PlaylistWizard/pull/309))

## 3.14.0

### Minor Changes

- feat: add deduplicate playlist action to remove duplicate items within playlists ([#303](https://github.com/suzuki3jp/PlaylistWizard/pull/303))

### Patch Changes

- fix: invalidate playlists query after undo action to update UI immediately ([#306](https://github.com/suzuki3jp/PlaylistWizard/pull/306))

## 3.13.0

### Minor Changes

- feat: add structured playlist tree preview to sync dialog ([#299](https://github.com/suzuki3jp/PlaylistWizard/pull/299))

### Patch Changes

- fix: use proxy endpoint for YouTube no_thumbnail.jpg in editor components ([#301](https://github.com/suzuki3jp/PlaylistWizard/pull/301))

## 3.12.0

### Minor Changes

- feat: add user menu for improved responsive design ([#293](https://github.com/suzuki3jp/PlaylistWizard/pull/293))

## 3.11.0

### Minor Changes

- feat: add a button to create playlists ([#285](https://github.com/suzuki3jp/PlaylistWizard/pull/285))

## 3.10.2

### Patch Changes

- fix: refresh playlists after sync ([`8da66100e4ee8a1d50f7b7f71e873f9220494c8d`](https://github.com/suzuki3jp/PlaylistWizard/commit/8da66100e4ee8a1d50f7b7f71e873f9220494c8d))
- Updated dependencies:
  - `@playlistwizard/spotify@0.2.1`
  - `@playlistwizard/youtube@0.7.2`

## 3.10.1

### Patch Changes

- fix: inherit items from entire dependency tree, not just direct dependencies in structured playlist sync ([#276](https://github.com/suzuki3jp/PlaylistWizard/pull/276))

## 3.10.0

### Minor Changes

- feat: import and export structured playlists definition ([#265](https://github.com/suzuki3jp/PlaylistWizard/pull/265))

## 3.9.0

### Minor Changes

- feat: add `StructuredPlaylistsEditor` ([#257](https://github.com/suzuki3jp/PlaylistWizard/pull/257))
- feat: sync playlists using definition stored in local storage ([#262](https://github.com/suzuki3jp/PlaylistWizard/pull/262))

## 3.8.0

### Minor Changes

- feat: add `redirect_to` query to `/sign-in` ([#255](https://github.com/suzuki3jp/PlaylistWizard/pull/255))
- feat: add API endpoint for StructuredPlaylists Definition JSON Schema ([#251](https://github.com/suzuki3jp/PlaylistWizard/pull/251))

## 3.7.2

### Patch Changes

- chore: update faq section design ([#244](https://github.com/suzuki3jp/PlaylistWizard/pull/244))

## 3.7.1

### Patch Changes

- fix: add missing footer translations ([#242](https://github.com/suzuki3jp/PlaylistWizard/pull/242))

## 3.7.0

### Minor Changes

- feat(app): redesign home ([#239](https://github.com/suzuki3jp/PlaylistWizard/pull/239))

## 3.6.0

### Minor Changes

- feat: implement Structured Playlists ([#228](https://github.com/suzuki3jp/PlaylistWizard/pull/228))

## 3.5.2

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/env@0.1.0`

## 3.5.1

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/shared@0.0.3`
  - `@playlistwizard/youtube@0.7.1`

## 3.5.0

### Minor Changes

- feat: add unstable CopyPlaylist undo support ([#213](https://github.com/suzuki3jp/PlaylistWizard/pull/213))
- feat: add Links section to Footer ([#213](https://github.com/suzuki3jp/PlaylistWizard/pull/213))
- feat: add removePlaylistItem to ProviderRepository ([#213](https://github.com/suzuki3jp/PlaylistWizard/pull/213))

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/youtube@0.7.0`
  - `@playlistwizard/shared@0.0.2`

## 3.4.2

### Patch Changes

- fix: replace destructured debug logger with logger instance ([#207](https://github.com/suzuki3jp/PlaylistWizard/pull/207))

## 3.4.1

### Patch Changes

- fix: check item id instead of videoId for duplicate detection in shouldAddItem ([#203](https://github.com/suzuki3jp/PlaylistWizard/pull/203))
- deps: update deps ([#203](https://github.com/suzuki3jp/PlaylistWizard/pull/203))

## 3.4.0

### Minor Changes

- feat: add metadata for OGP ([#198](https://github.com/suzuki3jp/PlaylistWizard/pull/198))

## 3.3.0

### Minor Changes

- feat: add `/playlists` link to header ([#195](https://github.com/suzuki3jp/PlaylistWizard/pull/195))

## 3.2.0

### Minor Changes

- feat: delete suffix ("- Topic") of YouTube Music songs ([#192](https://github.com/suzuki3jp/PlaylistWizard/pull/192))

### Patch Changes

- refactor: move useAuth to `presentation/` from `hooks/` ([#192](https://github.com/suzuki3jp/PlaylistWizard/pull/192))
- refactor: move tooltip to `presentation/` from `features/` ([#192](https://github.com/suzuki3jp/PlaylistWizard/pull/192))
- refactor: move localization to `src/ from `features/` ([#191](https://github.com/suzuki3jp/PlaylistWizard/pull/191))
- fix: correct redirect path in AuthButton ([#191](https://github.com/suzuki3jp/PlaylistWizard/pull/191))
- fix: correct wrong sign-in page path ([#192](https://github.com/suzuki3jp/PlaylistWizard/pull/192))
- refactor: move Providers to `presentation/` from `features/` ([#193](https://github.com/suzuki3jp/PlaylistWizard/pull/193))
- refactor: move privacy to `presentation/` from `features/` ([#191](https://github.com/suzuki3jp/PlaylistWizard/pull/191))
- refactor: move terms implementation to `presentation/` from `features/` ([#191](https://github.com/suzuki3jp/PlaylistWizard/pull/191))

## 3.1.0

### Minor Changes

- feat: move `/login` to `sign-in` and redirect to `sign-in` ([#189](https://github.com/suzuki3jp/PlaylistWizard/pull/189))
- feat: redirect from `/sign-in` to `/playlists` if the user is already signed in ([#189](https://github.com/suzuki3jp/PlaylistWizard/pull/189))

### Patch Changes

- refactor: move components to presentation directory ([#188](https://github.com/suzuki3jp/PlaylistWizard/pull/188))
- fix: prioritize props over default styles in HighlightedLink ([#188](https://github.com/suzuki3jp/PlaylistWizard/pull/188))
- Updated dependencies:
  - `@playlistwizard/logger@0.2.0`

## 0.0.11

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/spotify@0.2.0`

## 0.0.10

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/spotify@0.1.2`

## 0.0.9

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/spotify@0.1.1`

## 0.0.8

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/spotify@0.1.0`

## 0.0.7

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/youtube@0.6.0`

## 0.0.6

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/youtube@0.5.0`

## 0.0.5

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/youtube@0.4.0`

## 0.0.4

### Patch Changes

- Updated dependencies:
  - `@playlistwizard/youtube@0.3.0`

## 0.0.3

### Patch Changes

- Updated dependencies [[`f9e67b5`](https://github.com/suzuki3jp/PlaylistWizard/commit/f9e67b5148a325565ae4f86f75b98927a42e9667), [`da08eca`](https://github.com/suzuki3jp/PlaylistWizard/commit/da08ecaaf3ff0a4d0c7c68002a23638ce2ea7e69)]:
  - @playlistwizard/youtube@0.2.0

## 0.0.2

### Patch Changes

- Updated dependencies [[`3ba1298`](https://github.com/suzuki3jp/PlaylistWizard/commit/3ba12984aa6e776369425ed6ed1102e3226a5d2f)]:
  - @playlistwizard/youtube@0.1.0

## 0.0.1

### Patch Changes

- Updated dependencies [[`5e56236`](https://github.com/suzuki3jp/PlaylistWizard/commit/5e5623690b31f94f6648eff9fd1b4c33c8f8678d), [`966bd0d`](https://github.com/suzuki3jp/PlaylistWizard/commit/966bd0ddb811f674384e9167d5a048fc379aba24)]:
  - @playlistwizard/shared-ui@0.1.0
  - @playlistwizard/logger@0.1.0
  - @playlistwizard/youtube@0.0.2
