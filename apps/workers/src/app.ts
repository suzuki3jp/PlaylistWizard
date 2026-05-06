import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import { createAuth, type WorkerAuth } from "./auth";
import { createDbConnection, type Db } from "./db";
import type { Env } from "./env";
import { jobsRoute } from "./routes/jobs";

type Variables = {
  db: Db;
  auth: WorkerAuth;
};

export const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  .use(async (c, next) => {
    const connection = await createDbConnection(c.env.DATABASE_URL);
    const { db } = connection;
    const auth = createAuth(db, {
      baseURL: c.env.BETTER_AUTH_URL,
      secret: c.env.BETTER_AUTH_SECRET,
      googleClientId: c.env.GOOGLE_CLIENT_ID,
      googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
    });
    c.set("db", db);
    c.set("auth", auth);
    try {
      await next();
    } finally {
      await connection.close();
    }
  })
  .route("/jobs", jobsRoute)
  .get("/health", (c) => c.text("OK"))
  .onError((err, c) => {
    Sentry.captureException(err);
    return c.text("Internal Server Error", 500);
  });

export type AppType = typeof app;
