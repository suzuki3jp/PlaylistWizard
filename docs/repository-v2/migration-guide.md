# Repository v2 — Migration Guide

This guide covers migrating usecases and server actions from the v1 repository layer (`repository/providers/`) to v2 (`repository/v2/`).

## Architecture Shift

### v1: Server-Only Execution

v1 uses the `googleapis` SDK (YouTube) and `@playlistwizard/spotify` package, both of which depend on Node.js runtime APIs. This means repository calls **must** happen inside Server Actions:

```
Client Component → Server Action → v1 Repository → googleapis SDK → YouTube API
```

### v2: Client + Server Execution

v2 uses only the native `fetch` API, making it a set of pure functions that can run anywhere:

```
Client Component → v2 Repository → fetch → YouTube/Spotify API
```

or

```
Server Action → v2 Repository → fetch → YouTube/Spotify API
```

## Before/After Code Comparison

### Usecase: Getting a Full Playlist

**v1 (Server Action required):**

```typescript
// server action
"use server";
import { createProviderRepository } from "@/repository/providers/factory";

export async function getFullPlaylistAction(
  type: Provider,
  playlistId: string,
  accessToken: string,
) {
  const repo = createProviderRepository(type);
  // accessToken passed to every method call
  return await repo.getFullPlaylist(playlistId, accessToken);
}
```

**v2 (can be called anywhere):**

```typescript
import { getRepository } from "@/repository/v2/get-repository";

// accessToken passed once to constructor
const repo = getRepository(type, accessToken);
const result = await repo.getFullPlaylist(playlistId);
```

### Usecase: Creating a Playlist

**v1:**

```typescript
const repo = createProviderRepository(type);
const playlist = await repo.addPlaylist(title, privacy, accessToken);
```

**v2:**

```typescript
const repo = getRepository(type, accessToken);
const result = await repo.addPlaylist(title, privacy);

if (result.isOk()) {
  const playlist = result.value;
} else {
  const error = result.error; // RepositoryError with typed status
}
```

## Error Handling Changes

### v1: `BaseProviderError` with Numeric Codes

```typescript
try {
  await repo.getFullPlaylist(id, token);
} catch (error) {
  if (error instanceof BaseProviderError) {
    // error.code is a number (e.g., 401, 403)
    if (error.code === 401) { /* ... */ }
  }
}
```

### v2: `RepositoryError` with `ErrorStatus` Strings

```typescript
const result = await repo.getFullPlaylist(id);

if (result.isErr()) {
  // result.error.status is a typed string
  switch (result.error.status) {
    case "UNAUTHORIZED":
      // Handle expired token
      break;
    case "NOT_FOUND":
      // Handle missing playlist
      break;
    case "TOO_MANY_REQUESTS":
      // Handle rate limiting
      break;
    case "VALIDATION_ERROR":
      // API response didn't match expected schema
      break;
  }
}
```

Key differences:
- v1 uses `try/catch` with thrown exceptions
- v2 uses `Result<T, RepositoryError>` from neverthrow — errors are values, not exceptions
- v2 error statuses are string literals, enabling exhaustive `switch` checks with TypeScript

## Step-by-Step Migration

### 1. Identify the Server Action / Usecase

Find the server action or usecase that uses v1:

```typescript
import { createProviderRepository } from "@/repository/providers/factory";
```

### 2. Replace the Import

```typescript
import { getRepository } from "@/repository/v2/get-repository";
```

### 3. Update Repository Instantiation

```diff
- const repo = createProviderRepository(type);
- const result = await repo.getFullPlaylist(playlistId, accessToken);
+ const repo = getRepository(type, accessToken);
+ const result = await repo.getFullPlaylist(playlistId);
```

### 4. Handle `Result` Return Type

v2 methods return `Result<T, RepositoryError>` instead of throwing. Update error handling:

```diff
- try {
-   const playlist = await repo.getFullPlaylist(playlistId, token);
-   return playlist;
- } catch (error) {
-   if (error instanceof BaseProviderError) {
-     // handle error
-   }
- }
+ const result = await repo.getFullPlaylist(playlistId);
+ if (result.isErr()) {
+   // handle result.error (RepositoryError)
+   return;
+ }
+ const playlist = result.value;
```

### 5. Remove Server Action Wrapper (if applicable)

If the server action existed solely to run v1 in a Node.js environment, it can potentially be removed. The v2 repository can be called directly from client-side code (e.g., React Query hooks).

### 6. Run Tests

```bash
pnpm test
```

## Migration Checklist

- [ ] Replace `createProviderRepository` import with `getRepository`
- [ ] Move `accessToken` from method parameters to constructor
- [ ] Update return type handling from thrown errors to `Result<T, RepositoryError>`
- [ ] Replace numeric error code checks with `ErrorStatus` string checks
- [ ] Evaluate if the server action wrapper is still needed
- [ ] Verify all tests pass
- [ ] Run `pnpm format && pnpm lint`
