import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { createPlaylistActionServices } from "@/composition/playlist-actions";
import {
  createAuth,
  verifySessionFromHeaders,
} from "@/infrastructure/auth/better-auth";
import { createDbConnection } from "@/infrastructure/db/connection";
import type { Env } from "../../env";
import type {
  AuthSession,
  WorkerAuth,
} from "../../infrastructure/auth/better-auth";
import {
  getCorsOrigins,
  getTrustedOrigins,
  isAllowedOrigin,
} from "../../shared/config";

type AuthVariables = {
  auth: WorkerAuth;
  session: AuthSession;
};

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const isStateChangingMethod = (method: string): boolean =>
  STATE_CHANGING_METHODS.has(method.toUpperCase());

export const createCorsMiddleware = (): MiddlewareHandler<{
  Bindings: Env;
}> =>
  cors({
    origin: (origin, c) =>
      isAllowedOrigin(origin, getCorsOrigins(c.env)) ? origin : null,
    credentials: true,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 600,
  });

export const requireTrustedOriginForMutation: MiddlewareHandler<{
  Bindings: Env;
}> = async (c, next) => {
  if (!isStateChangingMethod(c.req.method)) {
    await next();
    return;
  }

  const origin = c.req.header("Origin");
  if (!isAllowedOrigin(origin, getTrustedOrigins(c.env))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
};

export const requireSession: MiddlewareHandler<{
  Variables: AuthVariables;
}> = async (c, next) => {
  const session = await verifySessionFromHeaders(
    c.get("auth"),
    c.req.raw.headers,
  );

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("session", session);
  await next();
};

export const injectVariables: MiddlewareHandler = async (c, next) => {
  const connection = await createDbConnection(
    c.env.HYPERDRIVE.connectionString,
  );
  const { db } = connection;
  const auth = createAuth(db, c.env);
  c.set("db", db);
  c.set("auth", auth);
  c.set(
    "playlistActions",
    createPlaylistActionServices({
      auth,
      db,
      progressStream: c.env.PLAYLIST_ACTION_JOB_PROGRESS_STREAM,
      queue: c.env.PLAYLIST_ACTION_JOB_QUEUE,
    }),
  );

  try {
    await next();
  } finally {
    await connection.close();
  }
};
