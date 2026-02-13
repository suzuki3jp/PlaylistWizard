# Repository v2

## Overview

Repository v2 (`app/src/repository/v2/`) is the next-generation data access layer for PlaylistWizard. It replaces v1's SDK-based approach with native `fetch` API calls, enabling client-side execution and reducing external dependencies.

### Why v2?

The v1 repository layer depends on `googleapis` (Google's Node.js SDK) and `@playlistwizard/youtube` / `@playlistwizard/spotify` packages. The `googleapis` SDK is tightly coupled to Node.js runtime APIs, which means **v1 can only run in server-side environments** (i.e., through Next.js Server Actions).

v2 solves this by:

- **Using native `fetch` only** — no SDK dependencies, runs in any JavaScript environment (browser or server)
- **Zod schema validation** — runtime validation of all API responses with clear error messages
- **Unified error handling** — `RepositoryError` base class with typed `ErrorStatus` values
- **Constructor-based auth** — `accessToken` is passed once to the constructor, not to every method call

## Architecture

### v1 vs v2 Comparison

| Aspect | v1 (`repository/providers/`) | v2 (`repository/v2/`) |
|--------|------------------------------|------------------------|
| HTTP client | `googleapis` SDK, `@playlistwizard/*` packages | Native `fetch` API |
| Execution environment | Server-only (Node.js) | Client + Server |
| Auth pattern | `accessToken` passed to each method | `accessToken` passed to constructor |
| Response validation | None (trusts SDK types) | Zod schemas |
| Error handling | `BaseProviderError` with numeric codes | `RepositoryError` with `ErrorStatus` strings |
| Pagination | Manual, per-method | Built-in `fetchAllPages` / `fetchAllPagesFromUrl` |

### Directory Structure

```
repository/v2/
├── errors.ts                  # Base RepositoryError class and ErrorStatus type
├── index.ts                   # Repository interface definition
├── get-repository.ts          # Factory function
├── get-repository.test.ts
├── youtube/
│   ├── repository.ts          # YouTubeRepository implementation
│   ├── repository.test.ts
│   ├── errors.ts              # YouTubeRepositoryError
│   ├── errors.test.ts
│   ├── transformers.ts        # API response → domain entity transformers
│   ├── transformers.test.ts
│   └── schemas/               # Zod schemas for YouTube Data API v3 responses
│       ├── index.ts
│       ├── response.ts        # ListResponse helper
│       ├── playlist.ts
│       ├── playlist-item.ts
│       └── thumbnail.ts
└── spotify/
    ├── repository.ts          # SpotifyRepository implementation
    ├── repository.test.ts
    ├── errors.ts              # SpotifyRepositoryError
    ├── errors.test.ts
    ├── transformers.ts        # API response → domain entity transformers
    ├── transformers.test.ts
    └── schemas/               # Zod schemas for Spotify Web API responses
        ├── index.ts
        ├── response.ts        # PaginatedResponse + SnapshotResponse
        ├── playlist.ts
        ├── track.ts
        ├── image.ts
        └── user.ts
```

### Layered Design

Each provider (YouTube, Spotify) has four layers:

1. **Repository** (`repository.ts`) — Implements the `Repository` interface. Orchestrates API calls, handles pagination, and returns `Result<T, RepositoryError>`.
2. **Schemas** (`schemas/`) — Zod schemas that validate raw API JSON responses. Each schema maps to a specific API resource type.
3. **Transformers** (`transformers.ts`) — Pure functions that convert validated API response types into domain entities (`Playlist`, `PlaylistItem`, `FullPlaylist`).
4. **Errors** (`errors.ts`) — Provider-specific error class extending `RepositoryError`. Includes factory methods for creating errors from HTTP status codes or validation failures.

## Key Design Decisions

### Constructor-based `accessToken`

v1 passed `accessToken` as a parameter to every repository method. v2 passes it once to the constructor:

```typescript
// v1: token passed to every call
const repo = createProviderRepository(Provider.GOOGLE);
await repo.getFullPlaylist(playlistId, accessToken);

// v2: token passed once
const repo = getRepository(Provider.GOOGLE, accessToken);
await repo.getFullPlaylist(playlistId);
```

This reduces boilerplate and makes the repository instance self-contained — it holds everything it needs to make API calls.

### Unified Error Type

All errors are instances of `RepositoryError` with a typed `ErrorStatus`:

```typescript
type ErrorStatus =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";
```

This allows callers to handle errors consistently regardless of the provider:

```typescript
const result = await repo.getMyPlaylists();
if (result.isErr()) {
  switch (result.error.status) {
    case "UNAUTHORIZED":
      // redirect to login
    case "TOO_MANY_REQUESTS":
      // show rate limit message
  }
}
```

## Related Documentation

- [API Reference](./api-reference.md) — Full method signatures, error types, and internal methods
- [Migration Guide](./migration-guide.md) — Step-by-step guide for migrating usecases from v1 to v2
