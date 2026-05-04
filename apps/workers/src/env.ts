export type QueueLike = {
  send(message: unknown): Promise<void>;
};

export type Env = {
  BETTER_AUTH_URL: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  PLAYLIST_ACTION_JOB_QUEUE: QueueLike;
};
