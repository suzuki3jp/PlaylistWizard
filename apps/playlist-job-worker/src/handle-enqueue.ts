import type { QueueMessage } from "@playlistwizard/job-queue";
import type { Env } from "./types";

export async function handleEnqueue(
  request: Request,
  env: Env,
): Promise<Response> {
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

  await env.PLAYLIST_QUEUE.sendBatch(body.messages.map((m) => ({ body: m })));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
