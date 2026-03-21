import type { QueueMessage } from "@playlistwizard/job-queue";
import { OperationType } from "@playlistwizard/job-queue";
import type { Env } from "./types";
import { chunkArray, QUEUE_BATCH_LIMIT } from "./utils";

// QueueMessage で有効なオペレーション種別のみ（JobType の copy/merge 等は除外）
const VALID_QUEUE_MESSAGE_TYPES: string[] = [
  OperationType.CreatePlaylist,
  OperationType.AddPlaylistItem,
  OperationType.RemovePlaylistItem,
  OperationType.UpdatePlaylistItemPosition,
];

function isValidQueueMessage(m: unknown): m is QueueMessage {
  if (typeof m !== "object" || m === null) return false;
  const obj = m as Record<string, unknown>;

  if (
    typeof obj.jobId !== "string" ||
    typeof obj.opIndex !== "number" ||
    !Number.isInteger(obj.opIndex) ||
    obj.opIndex < 0 ||
    typeof obj.type !== "string" ||
    !VALID_QUEUE_MESSAGE_TYPES.includes(obj.type) ||
    typeof obj.accId !== "string"
  ) {
    return false;
  }

  switch (obj.type) {
    case OperationType.CreatePlaylist:
      return (
        typeof obj.title === "string" &&
        ["public", "private", "unlisted"].includes(obj.privacy as string)
      );
    case OperationType.AddPlaylistItem:
      return (
        typeof obj.playlistId === "string" && typeof obj.videoId === "string"
      );
    case OperationType.RemovePlaylistItem:
      return typeof obj.playlistItemId === "string";
    case OperationType.UpdatePlaylistItemPosition:
      return (
        typeof obj.playlistId === "string" &&
        typeof obj.playlistItemId === "string" &&
        typeof obj.resourceId === "string" &&
        typeof obj.position === "number"
      );
    default:
      return false;
  }
}

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

  const invalid = body.messages.findIndex((m) => !isValidQueueMessage(m));
  if (invalid !== -1) {
    return new Response(
      JSON.stringify({ error: `messages[${invalid}] is invalid` }),
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
