import { createHonoApp } from "../hono";
import { requireSession, requireTrustedOriginForMutation } from "../middleware";
import { jobsCreateRoute } from "./create";
import { jobsDismissRoute } from "./dismiss";
import { jobProgressRoute } from "./progress";

// Keep route registration chained so Hono retains the complete RPC schema in
// the return type. Calling route() after assignment works at runtime but drops
// the mounted route types from AppType.
export const jobsRoute = createHonoApp()
  .use("/*", requireTrustedOriginForMutation)
  .use("/*", requireSession)
  .route("/progress", jobProgressRoute)
  .route("/create", jobsCreateRoute)
  .route("/dismiss", jobsDismissRoute);
