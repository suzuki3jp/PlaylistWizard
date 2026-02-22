# @playlistwizard/core

## 2.0.0

### Major Changes

- feat!: remove StructuredPlaylistsDefinitionLocalStorage (use DB storage instead) ([#326](https://github.com/suzuki3jp/PlaylistWizard/pull/326))

## 1.0.0

### Major Changes

- feat: remove Spotify support ([#323](https://github.com/suzuki3jp/PlaylistWizard/pull/323))

  - `@playlistwizard/core`: remove "spotify" from `provider` enum in `StructuredPlaylistsDefinitionSchema` (breaking change)
  - `@playlistwizard/app`: remove Spotify sign-in and account linking
