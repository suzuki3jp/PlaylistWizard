import type { QueueMessage } from "@playlistwizard/job-queue";

export interface Env {
  PLAYLIST_QUEUE: Queue<QueueMessage>;
  WORKER_SECRET: string;
  NEXT_APP_URL: string;
  SENTRY_DSN: string;
}
