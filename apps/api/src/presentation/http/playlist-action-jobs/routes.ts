import { createHonoApp } from "../hono";
import { requireSession, requireTrustedOriginForMutation } from "../middleware";
import { jobsCreateRoute } from "./create";
import { jobsDismissRoute } from "./dismiss";
import { jobProgressRoute } from "./progress";

export const jobsRoute = createHonoApp();

// apply middlewares for /jobs/*
jobsRoute.use("/*", requireTrustedOriginForMutation);
jobsRoute.use("/*", requireSession);

jobsRoute.route("/progress", jobProgressRoute);
jobsRoute.route("/create", jobsCreateRoute);
jobsRoute.route("/dismiss", jobsDismissRoute);
