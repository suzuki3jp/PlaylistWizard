import { API_V1_BASE_PATH } from "@playlistwizard/shared";
import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import type { Env } from "./env";
import { createHonoApp } from "./presentation/http/hono";
import {
  createCorsMiddleware,
  injectVariables,
} from "./presentation/http/middleware";
import { jobsRoute } from "./presentation/http/playlist-action-jobs/routes";

// Keep the versioned application separate so Hono RPC clients can target the
// v1 contract without exposing the unversioned Worker root as a public API.
const v1App = createHonoApp()
  .use("*", createCorsMiddleware())
  .use("*", injectVariables)
  .on(["GET", "POST"], "/api/auth/*", (c) => c.get("auth").handler(c.req.raw))
  .route("/jobs", jobsRoute)
  .get("/health", (c) => c.text("OK"))
  .onError((err, c) => {
    Sentry.captureException(err);
    return c.text("Internal Server Error", 500);
  });

export const app = new Hono<{ Bindings: Env }>().route(API_V1_BASE_PATH, v1App);

export type AppType = typeof v1App;
