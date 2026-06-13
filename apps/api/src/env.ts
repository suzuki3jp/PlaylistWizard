export type QueueLike = {
  send(message: unknown): Promise<void>;
};

export type Env = {
  API_URL: string;
  API_CORS_ORIGINS?: string;
  AUTH_COOKIE_DOMAIN?: string;
  AUTH_COOKIE_PREFIX?: string;
  AUTH_CROSS_SUBDOMAIN_COOKIES?: string;
  AUTH_TRUSTED_ORIGINS?: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  HYPERDRIVE: Hyperdrive;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  PLAYLIST_ACTION_JOB_QUEUE: QueueLike;
  SENTRY_DEBUG?: string;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  SENTRY_TUNNEL?: string;
};
