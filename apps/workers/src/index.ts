import type { StepQueueMessage } from "@playlistwizard/playlist-action-job";
import * as Sentry from "@sentry/cloudflare";
import { app } from "./app";
import { createAuth } from "./auth";
import { createDbConnection } from "./db";
import type { Env } from "./env";
import { processDlqMessage, processMessage } from "./queue-consumer";

export type { AppType } from "./app";

const sentryOptions = (env: Env) => ({
  dsn: env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN,
  environment: env.SENTRY_ENVIRONMENT,
  tracesSampleRate: Number(env.SENTRY_TRACES_SAMPLE_RATE ?? 1),
});

const captureQueueMessageError = (
  err: unknown,
  batch: MessageBatch<StepQueueMessage>,
  message: Message<StepQueueMessage>,
) => {
  Sentry.withScope((scope) => {
    scope.setTag("worker.trigger", "queue");
    scope.setTag("queue.name", batch.queue);
    scope.setTag("queue.kind", batch.queue.endsWith("-dlq") ? "dlq" : "main");
    scope.setContext("queue_message", {
      attempts: message.attempts,
      id: message.id,
      stepId: message.body.stepId,
    });
    Sentry.captureException(err);
  });
};

const handler = {
  fetch: app.fetch,
  async queue(batch: MessageBatch<StepQueueMessage>, env: Env): Promise<void> {
    const connection = await createDbConnection(env.DATABASE_URL);
    const { db } = connection;

    try {
      const auth = createAuth(db, {
        baseURL: env.BETTER_AUTH_URL,
        secret: env.BETTER_AUTH_SECRET,
        googleClientId: env.GOOGLE_CLIENT_ID,
        googleClientSecret: env.GOOGLE_CLIENT_SECRET,
      });

      const isDlq = batch.queue.endsWith("-dlq");

      for (const message of batch.messages) {
        try {
          if (isDlq) {
            await processDlqMessage(db, message.body);
          } else {
            await processMessage(
              db,
              env.PLAYLIST_ACTION_JOB_QUEUE,
              auth,
              message.body,
            );
          }
          message.ack();
        } catch (err) {
          captureQueueMessageError(err, batch, message);
          message.retry();
        }
      }
    } finally {
      await connection.close();
    }
  },
} satisfies ExportedHandler<Env, StepQueueMessage>;

export default Sentry.withSentry<Env, StepQueueMessage>(sentryOptions, handler);
