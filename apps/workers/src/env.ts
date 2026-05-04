export type QueueLike = {
  send(message: unknown): Promise<void>;
};

export type Env = {
  BETTER_AUTH_URL: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  PLAYLIST_ACTION_JOB_QUEUE: QueueLike;
  SENTRY_DEBUG?: string;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  SENTRY_TUNNEL?: string;
};
