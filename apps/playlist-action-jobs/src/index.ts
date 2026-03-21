import type { QueueMessage } from "@playlistwizard/job-queue";
import * as Sentry from "@sentry/cloudflare";
import { handleCron } from "./handle-cron";
import { handleEnqueue } from "./handle-enqueue";
import { handleMessage } from "./handle-message";
import type { Env } from "./types";

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    environment: "workers",
    tracesSampleRate: 1.0,
  }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname === "/enqueue") return handleEnqueue(request, env);
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    },

    async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
      for (const msg of batch.messages) {
        try {
          await handleMessage(msg, env);
        } catch (error) {
          Sentry.captureException(error);
          msg.retry();
        }
      }
    },

    async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
      await handleCron(env);
    },
  },
);
