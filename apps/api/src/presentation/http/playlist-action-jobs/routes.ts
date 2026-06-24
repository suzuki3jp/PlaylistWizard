import { vValidator } from "@hono/valibot-validator";
import { toAccountId } from "@playlistwizard/core/ids";
import {
  createJobRequestSchema,
  dismissJobsRequestSchema,
} from "@playlistwizard/playlist-action-job";
import { createHonoApp } from "../hono";
import { requireSession, requireTrustedOriginForMutation } from "../middleware";
import { jobProgressRoute } from "./progress/routes";

export const jobsRoute = createHonoApp();

// apply middlewares for /jobs/*
jobsRoute.use("/*", requireTrustedOriginForMutation);
jobsRoute.use("/*", requireSession);

jobsRoute.route("/progress", jobProgressRoute);

jobsRoute.post(
  "/create",
  vValidator("json", createJobRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json({ details: result.issues, error: "Invalid request" }, 400);
    }
  }),
  async (c) => {
    const session = c.get("session");
    const { createCreatePlaylistActionJob } = c.get("playlistActions");
    const { accountId, payload } = c.req.valid("json");

    const result = await createCreatePlaylistActionJob({
      accountId: toAccountId(accountId),
      payload,
      userId: session.user.id,
    });

    if (result.type === "account_not_found") {
      return c.json({ error: "Forbidden" }, 403);
    }

    if (result.type === "enqueue_failed") {
      return c.json({ error: "Failed to enqueue job" }, 500);
    }

    return c.json({ jobId: result.jobId }, 201);
  },
);

jobsRoute.post(
  "/dismiss",
  vValidator("json", dismissJobsRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json({ details: result.issues, error: "Invalid request" }, 400);
    }
  }),
  async (c) => {
    const session = c.get("session");
    const { dismissPlaylistActionJobs } = c.get("playlistActions");
    const { jobIds } = c.req.valid("json");

    const result = await dismissPlaylistActionJobs({
      jobIds,
      userId: session.user.id,
    });

    if (result.type === "active_jobs") {
      return c.json(
        {
          error: "Active jobs cannot be dismissed",
          jobIds: result.jobIds,
        },
        409,
      );
    }

    return c.json({ jobIds: result.jobIds });
  },
);
