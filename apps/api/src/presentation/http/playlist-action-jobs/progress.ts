import { INITIAL_SNAPSHOT_HEADER } from "@/presentation/durable-objects/playlist-action-job-progress-stream";
import { createHonoApp } from "@/presentation/http/hono";
import { getTrustedOrigins, isAllowedOrigin } from "@/shared/config";
import { JOB_PROGRESS_STREAM_CONNECT_REQUEST_URL } from "@/shared/job-progress-stream-internal-request";
import { forbidden } from "../errors/forbidden";

// /jobs/progress
export const jobProgressRoute = createHonoApp().get("/", async (c) => {
  const origin = c.req.header("Origin");
  if (!isAllowedOrigin(origin, getTrustedOrigins(c.env))) {
    return forbidden(c);
  }

  if (c.req.header("Upgrade")?.toLowerCase() !== "websocket") {
    return c.text("Expected WebSocket upgrade", 426);
  }

  const session = c.get("session");
  const { getJobProgressSnapshot } = c.get("playlistActions");
  const initialSnapshot = await getJobProgressSnapshot(session.user.id);
  const id = c.env.PLAYLIST_ACTION_JOB_PROGRESS_STREAM.idFromName(
    session.user.id,
  );
  const stub = c.env.PLAYLIST_ACTION_JOB_PROGRESS_STREAM.get(id);
  const headers = new Headers(c.req.raw.headers);
  headers.set(INITIAL_SNAPSHOT_HEADER, initialSnapshot);

  return stub.fetch(
    new Request(JOB_PROGRESS_STREAM_CONNECT_REQUEST_URL, {
      headers,
      method: "GET",
    }),
  );
});
