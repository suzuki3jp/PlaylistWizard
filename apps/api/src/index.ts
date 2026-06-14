import * as Sentry from "@sentry/cloudflare";
import { app } from "./app";
import type { Env } from "./env";

export { PlaylistActionJobProgressStream } from "./presentation/durable-objects/playlist-action-job-progress-stream";

import { handlePlaylistActionJobQueueBatch } from "./presentation/queue/playlist-action-jobs/handler";

export type { AppType } from "./app";

const sentryOptions = (env: Env) => ({
  dsn: env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN,
  environment: env.SENTRY_ENVIRONMENT,
  tracesSampleRate: Number(env.SENTRY_TRACES_SAMPLE_RATE ?? 1),
});

const handler = {
  fetch: app.fetch,
  queue: handlePlaylistActionJobQueueBatch,
} satisfies ExportedHandler<Env, unknown>;

export default Sentry.withSentry<Env, unknown>(sentryOptions, handler);
