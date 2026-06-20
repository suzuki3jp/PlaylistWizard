# Use Durable Objects for live job progress delivery

Playlist Action Jobs will keep the database as the source of truth for Job and Step state, while Durable Objects are used for live WebSocket delivery of progress updates. This preserves durable retry, DLQ, dismissal, and recovery behavior in the existing Job store, while giving connected clients low-latency progress updates without polling. Durable Objects may hold connection state and short-lived delivery state, but they must not become the canonical record of Playlist Action Job progress.

Clients subscribe to live progress by User, not by individual Job or Account. The Tasks Monitor presents a User's active and recently completed backend Jobs as one stream, so a User-scoped Durable Object keeps connection management simple while preserving per-Job authorization through the authenticated User session. The Worker derives the stream identity from `session.user.id`; clients do not provide a User ID for the WebSocket subscription.

The implementation should avoid hard-coding User scope into every name and boundary. Account-scoped progress delivery is not required now, but the routing and stream-locator code should leave room for a future Account-scoped stream without trying to make that migration zero-cost.

Every WebSocket connection receives an initial snapshot before relying on live updates. The snapshot has the same meaning as the current backend Job polling result: the authenticated User's non-dismissed pending/running Jobs and recently completed/failed Jobs. After the snapshot, clients apply incremental job update events. Reconnection is snapshot-based, so the live event stream does not need durable replay semantics.

Progress updates are published only after the corresponding database write succeeds. Publishing is best-effort: a WebSocket delivery failure is captured for observability but must not fail, retry, or dead-letter the Playlist Action Job step. Clients recover missed updates by reconnecting and receiving a fresh snapshot.

WebSocket payloads expose sanitized Job progress only. `snapshot` events contain BackendJob summaries, and `job.updated` events contain one BackendJob summary; neither payload includes the Job `error` column, Step payloads, stack traces, Provider tokens, or other sensitive execution details. Client-facing `error` events must use generic messages and must never forward raw backend errors. Type compatibility is not enough for this boundary: code must build outbound BackendJob payloads through explicit database projections and runtime schema output, not by passing raw Job objects, spreading raw rows, or type-asserting broader objects as BackendJob.

The client does not fall back to database polling when the WebSocket cannot connect. Playlist Action Job screens establish live progress delivery and throw if the connection cannot be established or the initial snapshot cannot be received, letting the nearest application error boundary render an error screen and making the failure observable through Sentry. This makes missing progress an explicit unavailable state instead of silently running long-lived backend work that the user cannot observe, without turning unrelated application pages into WebSocket-dependent surfaces.

The client considers live progress ready only after it receives and validates the initial `snapshot` event. A WebSocket `open` event alone is not enough. If the snapshot is not received within 10 seconds, or if the socket closes or sends an invalid payload before readiness, the client throws.

After readiness, an unexpected disconnect triggers a bounded reconnect sequence before surfacing an error. The client retries three times with short backoff, such as 1s, 2s, and 4s. A successful reconnect must receive a fresh snapshot and replace the local progress state; if reconnection does not become ready within the bounded retries, the client throws.

The initial WebSocket migration will not preserve polling-era natural disappearance of completed or failed Jobs after a display retention window. Terminal Jobs remain visible until dismissed. Retention-driven removal can be added later as a separate queue-backed workflow that schedules removal when a Job becomes completed or failed.

Users can dismiss terminal backend Jobs, but pending and running backend Jobs remain visible. Dismissal updates the Job's `dismissed` state in the database and publishes a `job.removed` event after the database write succeeds. "Close all" applies only to terminal backend Jobs for persisted dismissal; active backend Jobs are not hidden.

Job creation HTTP responses remain narrow and return the Job ID. The Tasks Monitor reflects backend Jobs from the WebSocket snapshot and live update stream, not from optimistic HTTP placeholders. After a Job is created in the database, the usecase publishes a best-effort update event so the connected client can display it promptly.

The API Worker implementation should be designed directly for WebSocket progress delivery instead of preserving Next.js polling-era shapes. The old Next.js polling path, including polling hooks and server actions used only to read backend Jobs from the database, should be removed as part of the migration. Snapshot reads, dismissal mutations, and live update publishing belong on the API side.

Dismissal moves to the API Worker as part of the migration. The API verifies the authenticated User owns the Job, only allows dismissal of completed or failed Jobs, returns `409 Conflict` for active Jobs, updates `dismissed` in the database, and publishes `job.removed` after the write succeeds. Next.js server actions that directly dismiss backend Jobs in the database should be removed.

The WebSocket endpoint lives in the API Worker, not in Next.js. Next.js clients connect directly to the API origin using the Better Auth session cookie; the Worker authenticates the session, derives the User-scoped progress stream, and connects the client to the Durable Object. This keeps live progress delivery inside the API app's canonical auth boundary.

WebSocket authentication happens before upgrade. Requests without a valid session receive `401`; authorized User-scoped connections are routed using `session.user.id` rather than client-provided identifiers. Future Account-scoped routes should return `403` for Account ownership failures before upgrade.

The WebSocket upgrade request must pass the same trusted-origin policy used by authenticated API surfaces. Because the connection uses session cookies, the Worker checks the request `Origin` before upgrade and returns `403` for untrusted origins.

Usecases publish progress through an explicit Job progress publisher port rather than mixing delivery into the Job repository. The publisher receives sanitized BackendJob summaries for update events and Job IDs for removal events; it does not read raw Job rows from the database. This keeps database persistence, payload sanitization, and live delivery boundaries visible in the usecase layer.

Composition wires the progress publisher from the Durable Object binding alongside the existing Job repository and queue. HTTP and Queue entry points use the same playlist action service composition, passing the Durable Object namespace binding into the infrastructure publisher. After database writes, usecases obtain safe BackendJob summaries from the repository through a clearly named method such as `findSanitizedJobProgressSummary` and pass those summaries to the publisher.

Sanitized progress summary lookups return routing metadata separately from the public payload. The lookup includes the Job's `userId` for selecting the User-scoped progress stream and a sanitized BackendJob summary for the WebSocket event. The `userId` is not included in the BackendJob payload sent to clients.

If a sanitized progress summary cannot be produced, live publishing is skipped and Job execution continues. Missing Jobs or non-publishable Jobs are skipped quietly; invalid projections or schema failures are captured for observability because they indicate data or implementation bugs.

Observability focuses on progress delivery failures without turning them into execution failures. Publish failures and invalid sanitized summaries are captured in Sentry with Job context and then skipped. Durable Object socket send failures remove or close the affected socket. Client readiness timeouts and event parse failures throw so the client error boundary and Sentry can observe them.

Tests should emphasize the shared contract and security boundaries. Required coverage includes BackendJob/event helpers dropping extra fields, repository sanitized projections excluding sensitive fields, usecases publishing after database writes without failing execution on publish errors, Durable Object publish validation and subscribe-only client behavior, and Next.js provider behavior for readiness, invalid events, updates, and removals. Full browser end-to-end coverage is not required for the initial migration.

Snapshot reads use the same sanitized projection path, with a repository method such as `findSanitizedJobProgressSummariesForUser`. Snapshots include the authenticated User's non-dismissed pending, running, completed, and failed backend Jobs without the old 10-second display retention filter.

Next.js uses a playlist-feature-level progress provider rather than letting the monitor connect independently. Playlist Action controls and the Tasks Monitor consume the same live progress state. The provider renders a loading state while waiting for the initial snapshot, prevents action submission before readiness, and throws to the nearest error boundary if the snapshot does not arrive within the configured timeout or reconnection fails.

Safe BackendJob construction belongs in `@playlistwizard/playlist-action-job` as an execution contract, not in `@playlistwizard/core` as domain logic. The package should expose a factory or parser that accepts unknown input and returns schema output containing only the public BackendJob fields. API code should use that factory after narrow database projections and before publishing WebSocket payloads.

Job progress WebSocket event schemas also belong in `@playlistwizard/playlist-action-job` so the API Worker, Durable Object, and Next.js client parse the same execution contract. Events include `snapshot`, `job.updated`, `job.removed`, and sanitized `error` messages. Error events should use fixed client-facing codes rather than free-form backend messages. Event schemas, BackendJob factories, event builder helpers, and `serialize`/`parse` helpers should be shared from this package rather than duplicated in API, Durable Object, or Next.js code.

Changing the API URL environment contract is out of scope for the initial WebSocket migration. Next.js continues to use `NEXT_PUBLIC_API_URL` as the API origin for HTTP clients, and a small helper derives the WebSocket URL by resolving `/v1/jobs/progress` against that origin and converting `http`/`https` to `ws`/`wss`.

Durable Objects hold only the currently connected WebSocket instances for a progress stream. They do not store Job progress, replay buffers, or durable state in DO storage. Progress state remains in the database and is restored through snapshots.

Name the Durable Object class `PlaylistActionJobProgressStream` and the binding `PLAYLIST_ACTION_JOB_PROGRESS_STREAM`. The name describes the progress stream without hard-coding User scope into the class name, leaving room for a future Account-scoped locator.

Register the Durable Object class with a migration tag such as `v1-playlist-action-job-progress-stream`.

The API Worker, not the Durable Object, owns authentication and snapshot construction. On `/v1/jobs/progress`, the API Worker checks Origin and session, reads a sanitized BackendJob snapshot for `session.user.id`, resolves the progress stream Durable Object, and hands the WebSocket plus serialized snapshot to that object. The Durable Object accepts the socket, sends the snapshot, stores the socket instance, and later broadcasts internal publish events.

The Durable Object exposes separate internal handlers for connection and publish concerns. The API Worker routes authenticated client upgrades to the object's `/connect` handler with the initial snapshot, while internal publishers call the object's `/publish` handler with validated progress events. The only externally reachable WebSocket route is the API Worker's `/v1/jobs/progress` endpoint.

The initial snapshot is serialized by the API Worker using the shared event serializer before it is passed to the Durable Object. The Durable Object does not recalculate, reshape, or stringify the snapshot; it sends the serialized snapshot as the first client message after accepting the socket.

The client WebSocket is a subscribe-only protocol. WebSocket is technically bidirectional, so the server must not treat client-sent messages as publish commands; unexpected client messages should be ignored or closed as policy violations. Publishing progress events is allowed only through internal Worker-to-Durable-Object calls, not through externally reachable client WebSocket messages or public publish routes.

Internal Worker-to-Durable-Object calls use the Cloudflare Durable Object binding as the trust boundary. The initial implementation does not add a separate shared secret for publish calls, provided no public publish route exists and the Durable Object still validates publish payloads through the shared schema before broadcasting.

Internal publish payloads are validated at both boundaries. The publisher builds Job progress events through the shared schema/factory before calling the Durable Object, and the Durable Object publish handler parses the incoming payload with the same schema before broadcasting the parsed output. Broadcast code must stringify the parsed schema output, not the original request body. Local ad hoc event types or duplicate validators should be avoided; shared helpers are the enforcement point for sanitization.

Shared serialization and parsing helpers throw on invalid input. Invalid outbound events are programmer errors; publisher code captures them for observability and continues Job execution because live delivery is best-effort. Invalid inbound client events are treated as progress-stream failure and surface through the client error boundary.

Live update ordering is not strictly guaranteed. Queue processing may publish multiple updates concurrently, and the client applies `job.updated` events as per-Job upserts. Each update carries a complete sanitized BackendJob summary, and reconnect snapshots are the convergence mechanism for missed or out-of-order live events.
