import { vValidator } from "@hono/valibot-validator";
import { createJobRequestSchema } from "@playlistwizard/playlist-action-job";
import { Hono } from "hono";
import type { PlaylistActionServices } from "../../../composition/playlist-actions";
import type { Env } from "../../../env";
import type { AuthSession } from "../../../infrastructure/auth/better-auth";

type Variables = {
  playlistActions: PlaylistActionServices;
  session: AuthSession;
};

export const jobsRoute = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>().post(
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
      accountId,
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
