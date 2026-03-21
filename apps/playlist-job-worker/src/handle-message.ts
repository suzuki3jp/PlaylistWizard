import type {
  AddPlaylistItemOperation,
  QueueMessage,
} from "@playlistwizard/job-queue";
import { JobStatus, OperationType } from "@playlistwizard/job-queue";
import * as Sentry from "@sentry/cloudflare";
import {
  type ApiClient,
  ApiError,
  createApiClient,
  isRateLimitError,
  isServerError,
} from "./api-client";
import type { Env } from "./types";

const MAX_RETRIES = 3;

const QUEUE_BATCH_LIMIT = 100;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function handleMessage(
  msg: Message<QueueMessage>,
  env: Env,
  api: ApiClient = createApiClient(env),
): Promise<void> {
  const { jobId } = msg.body;

  // 1. ジョブ取得
  let job: Awaited<ReturnType<ApiClient["getJob"]>>;
  try {
    job = await api.getJob(jobId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      msg.ack(); // 存在しない jobId → リトライ無意味
    } else {
      msg.retry(); // 一時的エラー → リトライ
    }
    return;
  }

  // 2. failed/cancelled → スキップ
  if (job.status === JobStatus.Failed || job.status === JobStatus.Cancelled) {
    msg.ack();
    return;
  }

  // 3. べき等性チェック
  const opIndex = msg.body.opIndex;
  if (job.result?.completedOpIndices?.includes(opIndex)) {
    msg.ack();
    return;
  }

  // 4. processing にマーク
  try {
    await api.updateJobStatus(jobId, JobStatus.Processing);
  } catch (error) {
    // ステータス更新失敗は続行
    Sentry.captureException(error);
  }

  // 5. 操作実行
  try {
    const op = msg.body;

    if (op.type === OperationType.CreatePlaylist) {
      // create-playlist 実行
      const result = await api.createPlaylist({
        jobId,
        accId: op.accId,
        opIndex: op.opIndex,
        title: op.title,
        privacy: op.privacy,
      });

      // 6a. 残りの add-playlist-item 操作を createdPlaylistId で補完してエンキュー
      const updatedJob = await api.getJob(jobId);
      const completedIndices = new Set(
        updatedJob.result?.completedOpIndices ?? [],
      );

      const addOps = updatedJob.operations
        .filter(
          (o): o is AddPlaylistItemOperation =>
            o.type === OperationType.AddPlaylistItem &&
            !completedIndices.has(o.opIndex),
        )
        .map((o) => ({
          body: {
            jobId,
            ...o,
            // null の playlistId は createdPlaylistId で補完
            playlistId: o.playlistId ?? result.playlistId,
          } as QueueMessage,
        }));

      if (addOps.length > 0) {
        for (const chunk of chunkArray(addOps, QUEUE_BATCH_LIMIT)) {
          await env.PLAYLIST_QUEUE.sendBatch(chunk);
        }
      }
    } else if (op.type === OperationType.AddPlaylistItem) {
      await api.addPlaylistItem({
        jobId,
        accId: op.accId,
        opIndex: op.opIndex,
        playlistId: op.playlistId,
        videoId: op.videoId,
      });
    } else if (op.type === OperationType.RemovePlaylistItem) {
      await api.removePlaylistItem({
        jobId,
        accId: op.accId,
        opIndex: op.opIndex,
        playlistItemId: op.playlistItemId,
      });
    } else if (op.type === OperationType.UpdatePlaylistItemPosition) {
      await api.updatePlaylistItemPosition({
        jobId,
        accId: op.accId,
        opIndex: op.opIndex,
        playlistId: op.playlistId,
        playlistItemId: op.playlistItemId,
        resourceId: op.resourceId,
        position: op.position,
      });
    }

    msg.ack();
  } catch (err) {
    if (isRateLimitError(err)) {
      msg.retry({ delaySeconds: 60 });
    } else if (isServerError(err)) {
      if (msg.attempts > MAX_RETRIES) {
        try {
          await api.updateJobStatus(jobId, JobStatus.Failed, String(err));
        } catch (error) {
          // ステータス更新失敗は無視
          Sentry.captureException(error);
        }
        msg.ack();
      } else {
        msg.retry();
      }
    } else {
      // 再試行不可エラー（4xx など）
      msg.ack();
    }
  }
}
