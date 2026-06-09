# Use Workers as the canonical auth server

PlaylistWizard will use Cloudflare Workers as the canonical Better Auth server while the Next.js app remains the UI and Better Auth client. Auth endpoints and OAuth callbacks live on `api.playlistwizard.app`, session cookies are shared across `.playlistwizard.app`, and Workers are responsible for validating sessions, **Account** ownership, and Provider token usage for backend APIs. Next.js may keep its Better Auth server instance during migration, but new backend work should move toward Workers and avoid direct Provider access token handling in Next.js.

Cookie-authenticated Worker APIs must apply shared middleware for CORS, mutation Origin checks, and session verification rather than duplicating those checks in individual endpoints.
