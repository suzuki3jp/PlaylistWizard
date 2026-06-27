import {
  type StepQueueMessage,
  stepQueueMessageSchema,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import * as Sentry from "@sentry/cloudflare";
import { safeParse } from "valibot";
import { createApiRequestContext } from "../../../composition/request-context";
import type { Env } from "../../../env";

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

const captureDbConnectionCloseError = (
  err: unknown,
  batch: MessageBatch<unknown>,
  message: Message<unknown>,
) => {
  Sentry.withScope((scope) => {
    scope.setTag("worker.trigger", "queue");
    scope.setTag("queue.name", batch.queue);
    scope.setTag("queue.kind", batch.queue.endsWith("-dlq") ? "dlq" : "main");
    scope.setTag("queue.error_kind", "db_connection_close");
    scope.setContext("queue_message", {
      attempts: message.attempts,
      id: message.id,
      stepId: getMessageStepId(message.body),
    });
    Sentry.captureException(err);
  });
};

const parseQueueMessage = (
  batch: MessageBatch<unknown>,
  message: Message<unknown>,
): StepQueueMessage | null => {
  const parsedMessage = safeParse(stepQueueMessageSchema, message.body);
  if (!parsedMessage.success) {
    captureQueueMessageError(
      new Error("Invalid playlist action job queue message"),
      batch,
      message,
    );
    message.ack();
    return null;
  }

  return {
    stepId: toStepId(parsedMessage.output.stepId),
  };
};

const processQueueMessage = async (
  batch: MessageBatch<unknown>,
  env: Env,
  message: Message<unknown>,
): Promise<void> => {
  let context: Awaited<ReturnType<typeof createApiRequestContext>> | null =
    null;

  try {
    const queueMessage = parseQueueMessage(batch, message);
    if (!queueMessage) return;

    context = await createApiRequestContext(env);

    if (batch.queue.endsWith("-dlq")) {
      await context.playlistActions.processPlaylistActionDlqMessage(
        queueMessage,
      );
    } else {
      await context.playlistActions.processPlaylistActionStep(queueMessage);
    }
    message.ack();
  } catch (err) {
    captureQueueMessageError(err, batch, message);
    message.retry();
  } finally {
    try {
      await context?.close();
    } catch (err) {
      captureDbConnectionCloseError(err, batch, message);
    }
  }
};

export const handlePlaylistActionJobQueueBatch = async (
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> => {
  await Promise.all(
    batch.messages.map((message) => processQueueMessage(batch, env, message)),
  );
};
