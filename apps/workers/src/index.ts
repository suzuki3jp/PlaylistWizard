import type { StepQueueMessage } from "@playlistwizard/playlist-action-job";
import { app } from "./app";
import { createAuth } from "./auth";
import { createDb } from "./db";
import type { Env } from "./env";
import { processDlqMessage, processMessage } from "./queue-consumer";

export type { AppType } from "./app";

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<StepQueueMessage>, env: Env): Promise<void> {
    const db = await createDb(env.DATABASE_URL);
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
      } catch {
        message.retry();
      }
    }
  },
};
