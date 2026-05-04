import { Hono } from "hono";
import { jobsRoute } from "./routes/jobs";

// This file exports AppType for use by playlist-action-job-client.
// It avoids importing CF-specific types to keep AppType platform-neutral.
export const app = new Hono().route("/jobs", jobsRoute);

export type AppType = typeof app;
