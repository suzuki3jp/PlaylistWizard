# Repository v2 — API Reference

## Repository Interface

All repository methods return `Promise<Result<T, RepositoryError>>` using [neverthrow](https://github.com/supermacro/neverthrow).

```typescript
interface Repository {
  getMyPlaylists(): Promise<Result<Playlist[], RepositoryError>>;

  getFullPlaylist(playlistId: string): Promise<Result<FullPlaylist, RepositoryError>>;

  addPlaylist(title: string, privacy: PlaylistPrivacy): Promise<Result<Playlist, RepositoryError>>;

  addPlaylistItem(playlistId: string, resourceId: string): Promise<Result<PlaylistItem, RepositoryError>>;

  removePlaylistItem(itemId: string, playlistId: string): Promise<Result<void, RepositoryError>>;

  updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
  ): Promise<Result<PlaylistItem, RepositoryError>>;

  deletePlaylist(playlistId: string): Promise<Result<Playlist, RepositoryError>>;
}
```

### Method Details

#### `getMyPlaylists()`

Returns all playlists owned by the authenticated user. Handles pagination automatically.

#### `getFullPlaylist(playlistId)`

Returns a playlist with all its items. Fetches the playlist metadata first, then all playlist items (with pagination).

- **YouTube**: Fetches `/playlists` then paginates `/playlistItems`
- **Spotify**: Fetches `/playlists/{id}` then paginates remaining tracks via `tracks.next` URLs

#### `addPlaylist(title, privacy)`

Creates a new playlist.

- **YouTube**: POST to `/playlists` with `snippet.title` and `status.privacyStatus`
- **Spotify**: First fetches `/me` to get `userId`, then POST to `/users/{userId}/playlists`

#### `addPlaylistItem(playlistId, resourceId)`

Adds an item to a playlist.

- **YouTube**: `resourceId` is a YouTube video ID. POST to `/playlistItems` with `snippet.resourceId`
- **Spotify**: `resourceId` is a Spotify track ID. Converted to URI `spotify:track:{resourceId}`. Returns a minimal `PlaylistItem` with `snapshot_id` as the item ID.

#### `removePlaylistItem(itemId, playlistId)`

Removes an item from a playlist.

- **YouTube**: DELETE `/playlistItems?id={itemId}`. The `playlistId` parameter is unused.
- **Spotify**: DELETE `/playlists/{playlistId}/tracks` with track URI in body

#### `updatePlaylistItemPosition(itemId, playlistId, resourceId, position)`

Moves an item to a new position within a playlist.

- **YouTube**: PUT `/playlistItems` with `snippet.position`
- **Spotify**: First calls `getFullPlaylist` to find the current position, then PUT `/playlists/{playlistId}/tracks` with `range_start`, `insert_before`, and `range_length`

#### `deletePlaylist(playlistId)`

Deletes (or unfollows) a playlist. Returns the playlist that was deleted.

- **YouTube**: Fetches playlist first, then DELETE `/playlists?id={playlistId}`
- **Spotify**: Fetches playlist first, then DELETE `/playlists/{playlistId}/followers`

## Factory Function

```typescript
import { getRepository } from "@/repository/v2/get-repository";
import { Provider } from "@/entities/provider";

const repo = getRepository(Provider.GOOGLE, accessToken);
// or
const repo = getRepository(Provider.SPOTIFY, accessToken);
```

Returns a `Repository` instance for the given provider. Throws via `unreachable()` if an unknown provider is passed (compile-time exhaustiveness check).

## Error Types

### `ErrorStatus`

```typescript
type ErrorStatus =
  | "UNAUTHORIZED"     // 401 — Invalid or expired access token
  | "FORBIDDEN"        // 403 — Permission denied or quota exceeded
  | "NOT_FOUND"        // 404 — Resource not found
  | "CONFLICT"         // 409 — Resource conflict (YouTube only)
  | "TOO_MANY_REQUESTS" // 429 — Rate limit exceeded
  | "VALIDATION_ERROR" // 422 — Zod schema validation failed
  | "UNKNOWN_ERROR";   // 0   — Unmapped HTTP status or unexpected error
```

### `RepositoryError` (Base Class)

```typescript
abstract class RepositoryError extends Error {
  readonly code: number;    // HTTP status code (or 0 for unknown)
  readonly status: ErrorStatus;
}
```

### Provider Error Classes

Both `YouTubeRepositoryError` and `SpotifyRepositoryError` extend `RepositoryError` and provide three static factory methods:

```typescript
class YouTubeRepositoryError extends RepositoryError {
  static fromHttpStatus(status: number): YouTubeRepositoryError;
  static validationError(message: string): YouTubeRepositoryError;
  static unknownError(message?: string): YouTubeRepositoryError;
}

class SpotifyRepositoryError extends RepositoryError {
  static fromHttpStatus(status: number): SpotifyRepositoryError;
  static validationError(message: string): SpotifyRepositoryError;
  static unknownError(message?: string): SpotifyRepositoryError;
}
```

#### HTTP Status Mapping

| HTTP Status | YouTube | Spotify |
|-------------|---------|---------|
| 401 | UNAUTHORIZED | UNAUTHORIZED |
| 403 | FORBIDDEN | FORBIDDEN |
| 404 | NOT_FOUND | NOT_FOUND |
| 409 | CONFLICT | *(unmapped → UNKNOWN_ERROR)* |
| 429 | TOO_MANY_REQUESTS | TOO_MANY_REQUESTS |
| Other | UNKNOWN_ERROR | UNKNOWN_ERROR |

## Internal Methods

These are `private` methods on the repository classes, documented here for reference when extending:

### `rawFetch(path, params, options?)`

Base fetch wrapper. Builds the full URL, attaches `Authorization: Bearer {token}` header, and adds `Content-Type: application/json` when a body is present.

### `fetch<T>(path, schema, params, options?)`

Calls `rawFetch`, checks `response.ok`, parses JSON, and validates against a Zod schema. Returns `Result<T, RepositoryError>`.

### `fetchAllPages<T>(path, schema, params)` (YouTube)

Token-based pagination. Repeats `fetch` calls with `pageToken` parameter until no `nextPageToken` is returned. Collects all `items` arrays.

### `fetchAllPages<T>(path, schema, params)` (Spotify)

Offset-based pagination. Increments `offset` parameter by `limit` on each iteration until `next` is `null`.

### `fetchAllPagesFromUrl<T>(startUrl, schema)` (Spotify only)

URL-based pagination. Follows `next` URLs directly (used for fetching remaining track pages after the initial `getFullPlaylist` response).
