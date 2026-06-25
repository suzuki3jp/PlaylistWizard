import { vValidator } from "@hono/valibot-validator";
import { toAccountId } from "@playlistwizard/core";
import { createJobRequestSchema } from "@playlistwizard/playlist-action-job";
import { createHonoApp } from "../hono";
import { forbidden } from "../errors/forbidden";

export const jobsCreateRoute = createHonoApp().post(
  "/",
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
      return forbidden(c);
    }

    if (result.type === "enqueue_failed") {
      return c.json({ error: "Failed to enqueue job" }, 500);
    }

    return c.json({ jobId: result.jobId }, 201);
  },
);
