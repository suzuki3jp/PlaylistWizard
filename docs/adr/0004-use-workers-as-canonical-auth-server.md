# Use the API app as the canonical auth server

PlaylistWizard will use the API app as the canonical Better Auth server while the Next.js app remains the UI and Better Auth client. The API app lives in `apps/api`, is published as the `@playlistwizard/api` workspace package, and runs on Cloudflare Workers. Auth endpoints and OAuth callbacks live on `api.playlistwizard.app`, session cookies are shared across `.playlistwizard.app`, and the API app is responsible for validating sessions, **Account** ownership, and Provider token usage for backend APIs. Next.js may keep its Better Auth server instance during migration, but new backend work should move toward the API app and avoid direct Provider access token handling in Next.js.

Cloudflare Worker service names such as `playlistwizard-workers`, `playlistwizard-workers-dev`, and `playlistwizard-workers-production` remain unchanged to avoid deployment and infrastructure churn. They are runtime resource names, not the repository app name.

Cookie-authenticated API endpoints must apply shared middleware for CORS, mutation Origin checks, and session verification rather than duplicating those checks in individual endpoints.

Development and production auth cookies must be distinguishable when environments share the `playlistwizard.app` parent domain. The API app and Next.js app both support `AUTH_COOKIE_PREFIX`; production may keep the Better Auth default `better-auth`, while dev should use a different prefix such as `better-auth-dev`. Next.js route protection must pass the same prefix to Better Auth cookie detection so production cookies sent to `dev.playlistwizard.app` are ignored instead of being treated as dev sessions.
