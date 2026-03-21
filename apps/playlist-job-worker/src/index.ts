import type { QueueMessage } from "@playlistwizard/job-queue";
import { handleCron } from "./handle-cron";
import { handleEnqueue } from "./handle-enqueue";
import { handleMessage } from "./handle-message";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/enqueue") return handleEnqueue(request, env);
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      await handleMessage(msg, env);
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await handleCron(env);
  },
};
