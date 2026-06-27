import type { Env } from "../env";
import {
  createAuth,
  verifySessionFromHeaders,
  type AuthSession,
  type WorkerAuth,
} from "../infrastructure/auth/better-auth";
import { createDbConnection } from "../infrastructure/db/connection";
import {
  createPlaylistActionServices,
  type PlaylistActionServices,
} from "./playlist-actions";

export type ApiAuth = WorkerAuth;
export type ApiAuthSession = AuthSession;

export type ApiRequestContext = {
  auth: ApiAuth;
  playlistActions: PlaylistActionServices;
  close(): Promise<void>;
};

/**
 * Builds request-scoped API dependencies at the composition boundary so
 * presentation code does not import DB or auth infrastructure directly.
 */
export const createApiRequestContext = async (
  env: Env,
): Promise<ApiRequestContext> => {
  const connection = await createDbConnection(env.HYPERDRIVE.connectionString);
  const auth = createAuth(connection.db, env);

  return {
    auth,
    close: () => connection.close(),
    playlistActions: createPlaylistActionServices({
      auth,
      db: connection.db,
      progressStream: env.PLAYLIST_ACTION_JOB_PROGRESS_STREAM,
      queue: env.PLAYLIST_ACTION_JOB_QUEUE,
    }),
  };
};

/**
 * Verifies a request session through the composed auth implementation while
 * keeping Better Auth details inside the composition/infrastructure boundary.
 */
export const verifyApiSessionFromHeaders = (
  auth: ApiAuth,
  headers: Headers,
): Promise<ApiAuthSession | null> => verifySessionFromHeaders(auth, headers);
