import "server-only";
import { Hono } from "hono";
import * as v from "valibot";
import { type AccountId, toAccountId } from "@/entities/ids";
import { computeOperations } from "@/lib/api/compute-operations";
import {
  badRequest,
  forbidden,
  notFound,
  unauthorized,
} from "@/lib/api/error-response";
import { workerAuth } from "@/lib/api/middleware/worker-auth";
import {
  EnqueueJobRequest,
  type JobOperation,
  type JobPayload,
  type JobResponse,
  type JobResult,
  JobStatus,
  JobStatusSchema,
  OperationType,
  type QueueMessage,
  type StaleJobResponse,
} from "@/lib/schemas/jobs";
import { getAccessToken, getSessionUser } from "@/lib/user";
import type { JobRow } from "@/repository/db/jobs/repository";
import { jobsDbRepository } from "@/repository/db/jobs/repository";
import { queueRepository } from "@/repository/queue/repository";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";

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

function toStaleJobResponse(job: JobRow): StaleJobResponse {
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
    accId: job.accId,
    operations: (job.payload as JobPayload).operations ?? [],
  };
}

async function verifyTargetPlaylistOwnership(
  token: string,
  accId: AccountId,
  playlistId: string,
): Promise<boolean> {
  const repo = new YouTubeRepository(token, accId);
  const playlists = await repo.getMyPlaylists();
  if (playlists.isErr()) return false;
  return playlists.value.some((p) => p.id === playlistId);
}

export const jobsRouter = new Hono();

// POST /api/v1/jobs — エンキュー（BetterAuth セッション）
jobsRouter.post("/", async (c) => {
  const user = await getSessionUser();
  if (!user) return unauthorized(c);

  let body: v.InferOutput<typeof EnqueueJobRequest>;
  try {
    const raw = await c.req.json();
    body = v.parse(EnqueueJobRequest, raw);
  } catch {
    return badRequest(c);
  }

  // accId が自分のアカウントか確認
  const accId = toAccountId(body.accId);
  const providerIds = new Set<AccountId>(user.providers.map((p) => p.id));
  if (!providerIds.has(accId)) {
    return forbidden(c);
  }

  // source accId が存在する場合（Copy の sourceAccId など）も確認
  // merge/extract の sourcePlaylists の各 accId は自分以外のアカウントを許可する
  // （仕様上 sourceAccId は別アカウント可）

  // target アカウントのトークンが取得できるか確認
  const targetToken = await getAccessToken(accId);
  if (!targetToken) return forbidden(c);

  // targetPlaylistId 所有確認（copy / deduplicate / shuffle / merge / extract）
  if ("targetPlaylistId" in body && body.targetPlaylistId) {
    const owned = await verifyTargetPlaylistOwnership(
      targetToken,
      accId,
      body.targetPlaylistId,
    );
    if (!owned) return forbidden(c);
  }

  // FetchFullPlaylist → operations 確定
  const computeResult = await computeOperations(body);
  if (computeResult.isErr()) {
    if (computeResult.error === "token-unavailable") return forbidden(c);
    return c.json({ error: "Failed to compute operations" }, 500);
  }
  const operations: JobOperation[] = computeResult.value;

  if (operations.length === 0) {
    return badRequest(c);
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
  const createOp = operations.find(
    (op) => op.type === OperationType.CreatePlaylist,
  );

  try {
    if (createOp) {
      await queueRepository.enqueue([{ jobId: job.id, ...createOp }]);
    } else {
      const msgs: QueueMessage[] = [];
      for (const op of operations) {
        if (op.type === OperationType.AddPlaylistItem) {
          if (op.playlistId !== null) {
            msgs.push({ jobId: job.id, ...op, playlistId: op.playlistId });
          }
        } else {
          msgs.push({ jobId: job.id, ...op });
        }
      }
      await queueRepository.enqueue(msgs);
    }
  } catch {
    // エンキュー失敗時はジョブを失敗に変更
    await jobsDbRepository.updateJobStatus(
      job.id,
      JobStatus.Failed,
      "Enqueue failed",
    );
    return c.json({ error: "Failed to enqueue job" }, 500);
  }

  return c.json({ jobId: job.id }, 200);
});

// GET /api/v1/jobs/stale — Worker/Cron 用ストール一覧（WORKER_SECRET 認証）
jobsRouter.get("/stale", workerAuth, async (c) => {
  const staleJobs = await jobsDbRepository.getStaleJobs();
  return c.json(staleJobs.map(toStaleJobResponse));
});

// GET /api/v1/jobs/:id — ステータス取得（セッション or WORKER_SECRET）
jobsRouter.get("/:id", async (c) => {
  const jobId = c.req.param("id");
  const authHeader = c.req.header("Authorization");
  const workerSecret = process.env.WORKER_SECRET;

  if (workerSecret && authHeader === `Bearer ${workerSecret}`) {
    // Worker からのアクセス: userId 確認不要、operations も含めて返す
    const job = await jobsDbRepository.getJobByWorker(jobId);
    if (!job) return notFound(c);
    return c.json(toStaleJobResponse(job));
  }

  // セッション認証
  const user = await getSessionUser();
  if (!user) return unauthorized(c);

  const job = await jobsDbRepository.getJob(jobId, user.id);
  if (!job) return notFound(c);
  return c.json(toJobResponse(job));
});

// PATCH /api/v1/jobs/:id/cancel — キャンセル（BetterAuth セッション）
jobsRouter.patch("/:id/cancel", async (c) => {
  const user = await getSessionUser();
  if (!user) return unauthorized(c);

  const job = await jobsDbRepository.getJob(c.req.param("id"), user.id);
  if (!job) return notFound(c);

  if (job.status !== JobStatus.Pending && job.status !== JobStatus.Processing) {
    return c.json({ error: "Conflict" }, 409);
  }

  await jobsDbRepository.updateJobStatus(job.id, JobStatus.Cancelled);
  return c.json({ ok: true });
});

const UpdateStatusRequest = v.object({
  status: JobStatusSchema,
  error: v.optional(v.string()),
});

// PATCH /api/v1/jobs/:id/status — Worker 内部用（WORKER_SECRET 認証）
jobsRouter.patch("/:id/status", workerAuth, async (c) => {
  const jobId = c.req.param("id");
  let body: v.InferOutput<typeof UpdateStatusRequest>;
  try {
    body = v.parse(UpdateStatusRequest, await c.req.json());
  } catch {
    return badRequest(c);
  }
  await jobsDbRepository.updateJobStatus(jobId, body.status, body.error);
  return c.json({ ok: true });
});

const UpdateResultRequest = v.object({
  createdPlaylistId: v.string(),
});

// PATCH /api/v1/jobs/:id/result — Worker 内部用（create-playlist 完了時）
jobsRouter.patch("/:id/result", workerAuth, async (c) => {
  const jobId = c.req.param("id");
  let body: v.InferOutput<typeof UpdateResultRequest>;
  try {
    body = v.parse(UpdateResultRequest, await c.req.json());
  } catch {
    return badRequest(c);
  }

  const job = await jobsDbRepository.getJobByWorker(jobId);
  if (!job) return notFound(c);

  const currentResult: JobResult = job.result ?? { completedOpIndices: [] };
  await jobsDbRepository.updateJobResult(jobId, {
    ...currentResult,
    createdPlaylistId: body.createdPlaylistId,
  });
  return c.json({ ok: true });
});

const CompleteOpRequest = v.object({
  opIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

// PATCH /api/v1/jobs/:id/complete-op — Worker 内部用（各操作完了記録）
// playlist-ops API が opIndex を受け取って内部で呼ぶが、このエンドポイントも保持する
jobsRouter.patch("/:id/complete-op", workerAuth, async (c) => {
  const jobId = c.req.param("id");
  let body: v.InferOutput<typeof CompleteOpRequest>;
  try {
    body = v.parse(CompleteOpRequest, await c.req.json());
  } catch {
    return badRequest(c);
  }

  await jobsDbRepository.completeAndCheckOperation(jobId, body.opIndex);

  return c.json({ ok: true });
});
