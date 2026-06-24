import { vValidator } from "@hono/valibot-validator";
import { dismissJobsRequestSchema } from "@playlistwizard/playlist-action-job";
import { createHonoApp } from "../hono";

export const jobsDismissRoute = createHonoApp().post(
  "/",
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
