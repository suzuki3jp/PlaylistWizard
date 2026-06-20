import { API_V1_BASE_PATH } from "@playlistwizard/shared";
import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import {
  createPlaylistActionServices,
  type PlaylistActionServices,
} from "./composition/playlist-actions";
import type { Env } from "./env";
import {
  type AuthSession,
  createAuth,
  type WorkerAuth,
} from "./infrastructure/auth/better-auth";
import { createDbConnection, type Db } from "./infrastructure/db/connection";
import {
  createCorsMiddleware,
  requireSession,
  requireTrustedOriginForMutation,
} from "./presentation/http/middleware";
import { jobsRoute } from "./presentation/http/playlist-action-jobs/routes";

type Variables = {
  auth: WorkerAuth;
  db: Db;
  playlistActions: PlaylistActionServices;
  session: AuthSession;
};

// Keep the versioned application separate so Hono RPC clients can target the
// v1 contract without exposing the unversioned Worker root as a public API.
const v1App = new Hono<{ Bindings: Env; Variables: Variables }>()
  .use("*", createCorsMiddleware())
  .use("/jobs/*", requireTrustedOriginForMutation)
  .use(async (c, next) => {
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
  })
  .on(["GET", "POST"], "/api/auth/*", (c) => c.get("auth").handler(c.req.raw))
  .use("/jobs/*", requireSession)
  .route("/jobs", jobsRoute)
  .get("/health", (c) => c.text("OK"))
  .onError((err, c) => {
    Sentry.captureException(err);
    return c.text("Internal Server Error", 500);
  });

export const app = new Hono<{ Bindings: Env }>().route(API_V1_BASE_PATH, v1App);

export type AppType = typeof v1App;
