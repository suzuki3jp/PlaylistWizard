import type {
  AddPlaylistItemOperation,
  QueueMessage,
} from "@playlistwizard/job-queue";
import { OperationType } from "@playlistwizard/job-queue";
import * as Sentry from "@sentry/cloudflare";
import { type ApiClient, createApiClient } from "./api-client";
import type { Env } from "./types";
import { chunkArray, QUEUE_BATCH_LIMIT } from "./utils";

export async function handleCron(
  env: Env,
  api: ApiClient = createApiClient(env),
): Promise<void> {
  // 1. ストールジョブ一覧を取得
  const staleJobs = await api.getStaleJobs();

  for (const job of staleJobs) {
    try {
      const completedIndices = new Set(job.result?.completedOpIndices ?? []);
      const createdPlaylistId = job.result?.createdPlaylistId;

      const createOp = job.operations.find(
        (o) => o.type === OperationType.CreatePlaylist,
      );

      if (createOp && !completedIndices.has(createOp.opIndex)) {
        // create-playlist が未完了 → create-playlist のみ再投入
        await env.PLAYLIST_QUEUE.send({
          jobId: job.id,
          ...createOp,
        } as QueueMessage);
        continue;
      }

      // create-playlist 完了済み（または不要）→ 未完了の残り操作を再投入
      const pendingOps = job.operations.filter(
        (o) =>
          o.type !== OperationType.CreatePlaylist &&
          !completedIndices.has(o.opIndex),
      );

      if (pendingOps.length === 0) {
        // 全操作完了済み → スキップ
        continue;
      }

      const messages = pendingOps
        .map((o) => {
          if (o.type === OperationType.AddPlaylistItem) {
            const addOp = o as AddPlaylistItemOperation;
            const playlistId = addOp.playlistId ?? createdPlaylistId;
            if (!playlistId) return null; // 解決不能 → スキップ
            return {
              body: {
                jobId: job.id,
                ...addOp,
                playlistId,
              } as QueueMessage,
            };
          }
          return { body: { jobId: job.id, ...o } as QueueMessage };
        })
        .filter((m): m is { body: QueueMessage } => m !== null);

      if (messages.length > 0) {
        for (const chunk of chunkArray(messages, QUEUE_BATCH_LIMIT)) {
          await env.PLAYLIST_QUEUE.sendBatch(chunk);
        }
      }
    } catch (error) {
      // 1ジョブ失敗でも残りのジョブ処理を継続
      Sentry.captureException(error);
    }
  }
}
