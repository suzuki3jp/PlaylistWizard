import { vValidator } from "@hono/valibot-validator";
import { toAccountId, toUserId } from "@playlistwizard/core/ids";
import {
  createJobRequestSchema,
  dismissJobsRequestSchema,
} from "@playlistwizard/playlist-action-job";
import { Hono } from "hono";
import type { PlaylistActionServices } from "../../../composition/playlist-actions";
import type { Env } from "../../../env";
import type { AuthSession } from "../../../infrastructure/auth/better-auth";
import { getTrustedOrigins, isAllowedOrigin } from "../../../shared/config";
import { INITIAL_SNAPSHOT_HEADER } from "../../durable-objects/playlist-action-job-progress-stream";

type Variables = {
  playlistActions: PlaylistActionServices;
  session: AuthSession;
};

const DO_CONNECT_URL = "https://playlist-action-job-progress-stream/connect";

export const jobsRoute = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

jobsRoute.get("/progress", async (c) => {
  const origin = c.req.header("Origin");
  if (!isAllowedOrigin(origin, getTrustedOrigins(c.env))) {
    return c.text("Forbidden", 403);
  }

  if (c.req.header("Upgrade")?.toLowerCase() !== "websocket") {
    return c.text("Expected WebSocket upgrade", 426);
  }

  const session = c.get("session");
  const { getJobProgressSnapshot } = c.get("playlistActions");
  const initialSnapshot = await getJobProgressSnapshot(
    toUserId(session.user.id),
  );
  const id = c.env.PLAYLIST_ACTION_JOB_PROGRESS_STREAM.idFromName(
    session.user.id,
  );
  const stub = c.env.PLAYLIST_ACTION_JOB_PROGRESS_STREAM.get(id);
  const headers = new Headers(c.req.raw.headers);
  headers.set(INITIAL_SNAPSHOT_HEADER, initialSnapshot);

  return stub.fetch(
    new Request(DO_CONNECT_URL, {
      headers,
      method: "GET",
    }),
  );
});

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
      userId: toUserId(session.user.id),
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
      userId: toUserId(session.user.id),
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
