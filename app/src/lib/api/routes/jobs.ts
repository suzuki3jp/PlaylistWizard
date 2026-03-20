import "server-only";
import { Hono } from "hono";
import * as v from "valibot";
import { type AccountId, toAccountId } from "@/entities/ids";
import { computeOperations } from "@/lib/api/compute-operations";
import { workerAuth } from "@/lib/api/middleware/worker-auth";
import { enqueueMessages } from "@/lib/queue";
import {
  EnqueueJobRequest,
  type JobOperation,
  type JobResponse,
  type JobResult,
  type JobStatus,
  type QueueMessage,
} from "@/lib/schemas/jobs";
import { getAccessToken, getSessionUser } from "@/lib/user";
import type { JobRow } from "@/repository/db/jobs/repository";
import { jobsDbRepository } from "@/repository/db/jobs/repository";

// progress はレスポンス時に動的計算する（DB の progress カラムには書き込まない）
function toJobResponse(job: JobRow): JobResponse {
  const completedCount = job.result?.completedOpIndices?.length ?? 0;
  const progress =
    job.totalOpCount > 0
      ? Math.round((completedCount / job.totalOpCount) * 100)
      : 0;
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    progress,
    result: job.result ?? null,
    error: job.error ?? null,
  };
}

async function verifyTargetPlaylistOwnership(
  token: string,
  accId: AccountId,
  playlistId: string,
): Promise<boolean> {
  const { YouTubeRepository } = await import(
    "@/repository/v2/youtube/repository"
  );
  const repo = new YouTubeRepository(token, accId);
  const playlists = await repo.getMyPlaylists();
  if (playlists.isErr()) return false;
  return new Set(playlists.value.map((p) => p.id as string)).has(playlistId);
}

export const jobsRouter = new Hono();

// POST /api/v1/jobs — エンキュー（BetterAuth セッション）
jobsRouter.post("/", async (c) => {
  const user = await getSessionUser();
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  let body: v.InferOutput<typeof EnqueueJobRequest>;
  try {
    const raw = await c.req.json();
    body = v.parse(EnqueueJobRequest, raw);
  } catch {
    return c.json({ error: "Bad Request" }, 400);
  }

  // accId が自分のアカウントか確認
  const accId = toAccountId(body.accId);
  const providerIds = new Set(user.providers.map((p) => p.id));
  if (!providerIds.has(accId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // source accId が存在する場合（Copy の sourceAccId など）も確認
  // merge/extract の sourcePlaylists の各 accId は自分以外のアカウントを許可する
  // （仕様上 sourceAccId は別アカウント可）

  // target アカウントのトークンが取得できるか確認
  const targetToken = await getAccessToken(accId);
  if (!targetToken) return c.json({ error: "Forbidden" }, 403);

  // targetPlaylistId 所有確認（copy / deduplicate / shuffle / merge / extract）
  if ("targetPlaylistId" in body && body.targetPlaylistId) {
    const owned = await verifyTargetPlaylistOwnership(
      targetToken,
      accId,
      body.targetPlaylistId,
    );
    if (!owned) return c.json({ error: "Forbidden" }, 403);
  }

  // FetchFullPlaylist → operations 確定
  const computeResult = await computeOperations(body);
  if (computeResult.isErr()) {
    if (computeResult.error === "token-unavailable")
      return c.json({ error: "Forbidden" }, 403);
    return c.json({ error: "Failed to compute operations" }, 500);
  }
  const operations: JobOperation[] = computeResult.value;

  if (operations.length === 0) {
    return c.json({ error: "No operations to perform" }, 400);
  }

  // DB INSERT
  const job = await jobsDbRepository.createJob({
    userId: user.id,
    accId: body.accId,
    type: body.type,
    operations,
    totalOpCount: operations.length,
  });

  // フェーズ分割エンキュー
  // create-playlist がある → create-playlist のみ投入（Worker が完了後に残りをエンキュー）
  // create-playlist がない → 全操作を一斉投入
  const createOp = operations.find((op) => op.type === "create-playlist");

  try {
    if (createOp) {
      await enqueueMessages([{ jobId: job.id, ...createOp }]);
    } else {
      const msgs: QueueMessage[] = [];
      for (const op of operations) {
        if (op.type === "add-playlist-item") {
          if (op.playlistId !== null) {
            msgs.push({ jobId: job.id, ...op, playlistId: op.playlistId });
          }
        } else {
          msgs.push({ jobId: job.id, ...op });
        }
      }
      await enqueueMessages(msgs);
    }
  } catch {
    // エンキュー失敗時はジョブをキャンセルに変更
    await jobsDbRepository.updateJobStatus(
      job.id,
      "cancelled",
      "Enqueue failed",
    );
    return c.json({ error: "Failed to enqueue job" }, 500);
  }

  return c.json({ jobId: job.id }, 201);
});

// GET /api/v1/jobs/stale — Worker/Cron 用ストール一覧（WORKER_SECRET 認証）
jobsRouter.get("/stale", workerAuth, async (c) => {
  const staleJobs = await jobsDbRepository.getStaleJobs();
  return c.json(staleJobs.map(toJobResponse));
});

// GET /api/v1/jobs/:id — ステータス取得（セッション or WORKER_SECRET）
jobsRouter.get("/:id", async (c) => {
  const jobId = c.req.param("id");
  const authHeader = c.req.header("Authorization");
  const workerSecret = process.env.WORKER_SECRET;

  if (workerSecret && authHeader === `Bearer ${workerSecret}`) {
    // Worker からのアクセス: userId 確認不要
    const job = await jobsDbRepository.getJobByWorker(jobId);
    if (!job) return c.json({ error: "Not Found" }, 404);
    return c.json(toJobResponse(job));
  }

  // セッション認証
  const user = await getSessionUser();
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const job = await jobsDbRepository.getJob(jobId, user.id);
  if (!job) return c.json({ error: "Not Found" }, 404);
  return c.json(toJobResponse(job));
});

// PATCH /api/v1/jobs/:id/cancel — キャンセル（BetterAuth セッション）
jobsRouter.patch("/:id/cancel", async (c) => {
  const user = await getSessionUser();
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const job = await jobsDbRepository.getJob(c.req.param("id"), user.id);
  if (!job) return c.json({ error: "Not Found" }, 404);

  if (job.status !== "pending" && job.status !== "processing") {
    return c.json({ error: "Conflict" }, 409);
  }

  await jobsDbRepository.updateJobStatus(job.id, "cancelled");
  return c.json({ ok: true });
});

// PATCH /api/v1/jobs/:id/status — Worker 内部用（WORKER_SECRET 認証）
jobsRouter.patch("/:id/status", workerAuth, async (c) => {
  const jobId = c.req.param("id");
  let body: { status: JobStatus; error?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Bad Request" }, 400);
  }
  await jobsDbRepository.updateJobStatus(jobId, body.status, body.error);
  return c.json({ ok: true });
});

// PATCH /api/v1/jobs/:id/result — Worker 内部用（create-playlist 完了時）
jobsRouter.patch("/:id/result", workerAuth, async (c) => {
  const jobId = c.req.param("id");
  let body: { createdPlaylistId: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Bad Request" }, 400);
  }

  const job = await jobsDbRepository.getJobByWorker(jobId);
  if (!job) return c.json({ error: "Not Found" }, 404);

  const currentResult: JobResult = job.result ?? { completedOpIndices: [] };
  await jobsDbRepository.updateJobResult(jobId, {
    ...currentResult,
    createdPlaylistId: body.createdPlaylistId,
  });
  return c.json({ ok: true });
});

// PATCH /api/v1/jobs/:id/complete-op — Worker 内部用（各操作完了記録）
// playlist-ops API が opIndex を受け取って内部で呼ぶが、このエンドポイントも保持する
jobsRouter.patch("/:id/complete-op", workerAuth, async (c) => {
  const jobId = c.req.param("id");
  let body: { opIndex: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Bad Request" }, 400);
  }

  await jobsDbRepository.completeOperation(jobId, body.opIndex);

  // 全操作完了チェック
  const job = await jobsDbRepository.getJobByWorker(jobId);
  if (job) {
    const completedCount = job.result?.completedOpIndices?.length ?? 0;
    if (completedCount >= job.totalOpCount) {
      await jobsDbRepository.updateJobStatus(jobId, "completed");
    }
  }

  return c.json({ ok: true });
});
