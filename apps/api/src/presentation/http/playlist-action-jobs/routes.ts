import { vValidator } from "@hono/valibot-validator";
import { createHonoApp } from "../hono";
import { requireSession, requireTrustedOriginForMutation } from "../middleware";
import { jobsDismissRoute } from "./dismiss";
import { jobProgressRoute } from "./progress";
import {
  JobType,
  PlaylistActionPayload,
} from "@playlistwizard/playlist-action-job";
import { toAccountId } from "@playlistwizard/core/ids";
import { forbidden } from "@/presentation/http/errors/forbidden";
import { unreachable } from "@/shared/unreachable";

// Keep route registration chained so Hono retains the complete RPC schema in
// the return type. Calling route() after assignment works at runtime but drops
// the mounted route types from AppType.
export const jobsRoute = createHonoApp()
  .use("/*", requireTrustedOriginForMutation)
  .use("/*", requireSession)
  .route("/progress", jobProgressRoute)
  .route("/dismiss", jobsDismissRoute)
  .post("/", vValidator("json", PlaylistActionPayload), async (c) => {
    const session = c.get("session");
    const { enqueueCreatePlaylistActionJobUsecase } = c.get("playlistActions");

    const payload = c.req.valid("json");
    switch (payload.type) {
      case JobType.Create:
        const result = await enqueueCreatePlaylistActionJobUsecase({
          ...payload,
          accountId: toAccountId(payload.accountId),
          userId: session.user.id,
        });
        if (result.type === "account_not_found") {
          return forbidden(c);
        }

        if (result.type === "enqueue_failed") {
          return c.json({ error: "Failed to enqueue job" }, 500);
        }

        return c.json({ jobId: result.jobId }, 201);

      default:
        return unreachable(payload.type, `Unknown job type: ${payload.type}`);
    }
  });
