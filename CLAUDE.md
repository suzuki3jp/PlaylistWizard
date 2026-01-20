# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication

- Respond in the same language as the user's request (e.g., Japanese for Japanese requests, English for English requests)

## Build & Development Commands

```bash
# Install and setup (first time)
pnpm bootstrap

# Development
pnpm dev              # Run all dev servers in parallel

# Testing
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage

# Code quality
pnpm format           # Format with Biome
pnpm lint             # Lint with Biome

# Building
pnpm build            # Build entire project
pnpm build:packages   # Build only packages

# Release workflow
pnpm cs               # Create changeset for versioning
```

**Running a single test file:**
```bash
pnpm vitest run path/to/test.test.ts
```

**App-specific commands (from app directory):**
```bash
pnpm dev    # Next.js dev server with Turbopack
pnpm build  # Production build
pnpm test   # Run app tests only
```

## Architecture Overview

**Monorepo Structure (pnpm workspaces):**
- `app/` - Next.js 16 application (main product)
- `packages/` - Shared libraries published to npm under `@playlistwizard/*`
  - `core` - Core business logic
  - `env` - Type-safe environment variables
  - `logger` - Logging utilities
  - `shared` - Shared utilities and types
  - `shared-ui` - Shared UI components
  - `spotify` - Spotify Web API client
  - `youtube` - YouTube Data API v3 client

**App Architecture (`app/src/`):**

The app follows domain-driven design with clear layer separation:

- `features/` - Feature modules containing domain-specific components, hooks, and logic
- `repository/` - Data access layer with provider pattern (Spotify, YouTube providers)
- `usecase/` - Business logic layer (actions, commands, value objects)
- `entities/` - Domain models
- `components/` - Reusable UI components (Shadcn-based)
- `app/` - Next.js App Router pages and API routes

**Key Patterns:**
- **Provider Pattern**: Platform abstraction via `repository/providers/` allowing consistent API across Spotify and YouTube
- **Repository**: Current data access implementation is directly under `repository/`. Note: `repository/v2/` is a WIP migration to an improved repository system (not yet in production)
- **Structured Playlists**: JSON format for cross-platform playlist sync (`repository/structured-playlists/`)
- **Jotai** for client state, **React Query** for server state
- **i18next** for internationalization (EN, JA) with URL-based routing (`/[lang]/...`)

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Radix UI, Shadcn components
- **Auth**: NextAuth.js (Google OAuth, Spotify OAuth)
- **Testing**: Vitest, Testing Library
- **Linting/Formatting**: Biome (not ESLint/Prettier)
- **Package Manager**: pnpm 9.5.0

## Development Notes

- Internal package dependencies use `workspace:*` protocol
- Changesets manage versioning - create changesets with `pnpm cs` before merging
- CI runs on PRs: Biome checks, tests with coverage uploaded to Codecov
- Environment variables are defined in `app/.env` (see `app/.env.example`)
