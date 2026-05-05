import {
  type StepQueueMessage,
  stepQueueMessageSchema,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import * as Sentry from "@sentry/cloudflare";
import { safeParse } from "valibot";
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

const getMessageStepId = (body: unknown): string | undefined =>
  typeof body === "object" &&
  body !== null &&
  "stepId" in body &&
  typeof body.stepId === "string"
    ? body.stepId
    : undefined;

const captureQueueMessageError = (
  err: unknown,
  batch: MessageBatch<unknown>,
  message: Message<unknown>,
) => {
  Sentry.withScope((scope) => {
    scope.setTag("worker.trigger", "queue");
    scope.setTag("queue.name", batch.queue);
    scope.setTag("queue.kind", batch.queue.endsWith("-dlq") ? "dlq" : "main");
    scope.setContext("queue_message", {
      attempts: message.attempts,
      id: message.id,
      stepId: getMessageStepId(message.body),
    });
    Sentry.captureException(err);
  });
};

const processQueueMessage = async (
  batch: MessageBatch<unknown>,
  env: Env,
  message: Message<unknown>,
): Promise<void> => {
  let connection: Awaited<ReturnType<typeof createDbConnection>> | null = null;

  try {
    const parsedMessage = safeParse(stepQueueMessageSchema, message.body);
    if (!parsedMessage.success) {
      captureQueueMessageError(
        new Error("Invalid playlist action job queue message"),
        batch,
        message,
      );
      message.ack();
      return;
    }

    const queueMessage: StepQueueMessage = {
      stepId: toStepId(parsedMessage.output.stepId),
    };

    connection = await createDbConnection(env.DATABASE_URL);
    const { db } = connection;

    if (batch.queue.endsWith("-dlq")) {
      await processDlqMessage(db, queueMessage);
    } else {
      const auth = createAuth(db, {
        baseURL: env.BETTER_AUTH_URL,
        secret: env.BETTER_AUTH_SECRET,
        googleClientId: env.GOOGLE_CLIENT_ID,
        googleClientSecret: env.GOOGLE_CLIENT_SECRET,
      });
      await processMessage(
        db,
        env.PLAYLIST_ACTION_JOB_QUEUE,
        auth,
        queueMessage,
      );
    }
    message.ack();
  } catch (err) {
    captureQueueMessageError(err, batch, message);
    message.retry();
  } finally {
    try {
      await connection?.close();
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag("worker.trigger", "queue");
        scope.setTag("queue.name", batch.queue);
        scope.setTag(
          "queue.kind",
          batch.queue.endsWith("-dlq") ? "dlq" : "main",
        );
        scope.setTag("queue.error_kind", "db_connection_close");
        scope.setContext("queue_message", {
          attempts: message.attempts,
          id: message.id,
          stepId: getMessageStepId(message.body),
        });
        Sentry.captureException(err);
      });
    }
  }
};

const handler = {
  fetch: app.fetch,
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    await Promise.all(
      batch.messages.map((message) => processQueueMessage(batch, env, message)),
    );
  },
} satisfies ExportedHandler<Env, unknown>;

export default Sentry.withSentry<Env, unknown>(sentryOptions, handler);
