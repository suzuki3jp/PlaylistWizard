# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PlaylistWizard is a playlist management web application supporting YouTube and Spotify. It's a pnpm monorepo with 7 public npm packages and a Next.js 16 application.

## Commands

```bash
# Development
pnpm dev                    # Start all dev servers (app + packages watch)
pnpm dev:network            # Dev server accessible via network (0.0.0.0)

# Building
pnpm build                  # Build everything (packages first, then app)
pnpm build:packages         # Build only packages

# Testing
pnpm test                   # Run all tests (Vitest)
pnpm test:coverage          # Run tests with coverage
pnpm vitest run <file>      # Run specific test file

# Code Quality
pnpm lint                   # Biome linter
pnpm format                 # Biome formatter (applies fixes)
```

## Architecture

### Monorepo Structure

- **`app/`** - Next.js 16 application (private, `@playlistwizard/app`)
- **`packages/`** - Public npm packages:
  - `core` - Business logic, structured playlist schema (Zod)
  - `youtube` - YouTube Data API v3 client
  - `spotify` - Spotify Web API client
  - `shared` - Shared utilities
  - `shared-ui` - React UI components
  - `logger` - Logging utility
  - `env` - Type-safe environment variables

### App Architecture (`app/src/`)

```
features/       # Feature modules (playlist, structured-playlists-editor, etc.)
presentation/   # Pages, hooks, providers
usecase/        # Application business logic
repository/     # Data access layer
entities/       # Domain models
components/     # Shared React components (Radix UI based)
common/         # Utilities
constants/      # Application constants
```

### Repository v2 Migration (In Progress)

The repository layer (`app/src/repository/`) is being migrated from v1 to v2:

- **v1** (`repository/providers/`): Uses `googleapis` SDK, `@playlistwizard/youtube`, `@playlistwizard/spotify` packages. Class-based with `accessToken` passed to each method. Currently used by all usecases and server actions.
- **v2** (`repository/v2/`): Uses native `fetch` API only (no SDK dependencies). Zod schemas for runtime API response validation. `accessToken` passed to constructor. Unified `RepositoryError` base class.

**Status**: v2 implementations for YouTube and Spotify are complete. Usecase/server action migration to v2 is not yet started. When adding new repository features, implement them in v2 (`repository/v2/`), not v1 (`repository/providers/`).

### Key Technologies

- **State**: Jotai (global), React Query (server)
- **Auth**: NextAuth.js
- **Validation**: Zod
- **Error Handling**: neverthrow (Result types)
- **Styling**: Tailwind CSS 4, Radix UI primitives
- **i18n**: i18next (English, Japanese)

## Testing

- Framework: Vitest with jsdom environment
- React Testing: @testing-library/react
- Test files: `*.test.ts` or `*.test.tsx` alongside source
- App tests have 30s timeout configured

## CI/CD

- **Test workflow**: Runs on PRs affecting `packages/` or `app/`
- **Biome workflow**: Runs `pnpm biome ci .` on PRs
- **Release workflow**: Changesets-based publishing on push to `develop`

## Changelog

Uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

Format: `{type}: {changelog}`

- **`packages/`**: Record all changes
- **`app/`**: Record only user-facing changes

## Workflow

- All commit messages, PR titles, and PR bodies must be written in English
- For new tasks, ask the user whether to create a new branch
- Do NOT commit automatically after completing work
- Commit only when explicitly requested
- Before committing, verify whether a changeset is needed based on the Changelog guidelines
  - If a changeset should be added, confirm with the user before including it
- Before committing, always run `pnpm format` and `pnpm lint`

## Branching

- `main` - Production branch
- `develop` - Development branch (PR target, releases trigger from here)

### Branch Naming Convention

Branch from `develop` with format: `{type}/{issue_number}/{title}`

Examples:
- `feature/283/sync-dialog-preview`
- `fix/123/login-error`
