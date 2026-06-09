import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import { type AuthSession, createAuth, type WorkerAuth } from "./auth";
import { createDbConnection, type Db } from "./db";
import type { Env } from "./env";
import {
  createCorsMiddleware,
  requireSession,
  requireTrustedOriginForMutation,
} from "./middleware";
import { jobsRoute } from "./routes/jobs";

type Variables = {
  db: Db;
  auth: WorkerAuth;
  session: AuthSession;
};

export const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  .use("*", createCorsMiddleware())
  .use("/jobs/*", requireTrustedOriginForMutation)
  .use(async (c, next) => {
    const connection = await createDbConnection(c.env.DATABASE_URL);
    const { db } = connection;
    const auth = createAuth(db, c.env);
    c.set("db", db);
    c.set("auth", auth);
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

export type AppType = typeof app;
