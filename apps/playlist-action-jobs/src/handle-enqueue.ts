import type { QueueMessage } from "@playlistwizard/job-queue";
import type { Env } from "./types";
import { chunkArray, QUEUE_BATCH_LIMIT } from "./utils";

export async function handleEnqueue(
  request: Request,
  env: Env,
): Promise<Response> {
  // HTTP メソッドチェック
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    });
  }

  // 認証チェック
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${env.WORKER_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ボディパース
  let body: { messages: QueueMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(body?.messages)) {
    return new Response(
      JSON.stringify({ error: "messages must be an array" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const batches = body.messages.map((m) => ({ body: m }));
  for (const chunk of chunkArray(batches, QUEUE_BATCH_LIMIT)) {
    await env.PLAYLIST_QUEUE.sendBatch(chunk);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
