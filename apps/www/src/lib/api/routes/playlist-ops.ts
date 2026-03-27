import "server-only";
import * as Sentry from "@sentry/nextjs";
import { Hono } from "hono";
import * as v from "valibot";
import type { UserId } from "@/entities/ids";
import { toAccountId } from "@/entities/ids";
import { PlaylistPrivacy } from "@/features/playlist/entities";
import { badRequest, forbidden } from "@/lib/api/error-response";
import { workerAuth } from "@/lib/api/middleware/worker-auth";
import {
  AddPlaylistItemRequest,
  CreatePlaylistRequest,
  RemovePlaylistItemRequest,
  UpdatePlaylistItemPositionRequest,
} from "@/lib/schemas/playlist-ops";
import { getAccessTokenByAccId } from "@/lib/user";
import { jobsDbRepository } from "@/repository/db/jobs/repository";
import { userDbRepository } from "@/repository/db/user/repository";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";

/**
 * accId が指定 userId のアカウントであることを確認する。
 * jobId → DB → userId の順で参照し、リクエストボディの userId は使わない。
 * job 行を返すことで呼び出し元が再利用できるようにする。
 */
async function verifyAccIdOwnership(
  jobId: string,
  accId: string,
): Promise<
  | {
      ok: true;
      userId: UserId;
      job: Awaited<ReturnType<typeof jobsDbRepository.getJobByWorker>>;
    }
  | { ok: false }
> {
  const job = await jobsDbRepository.getJobByWorker(jobId);
  if (!job) return { ok: false };

  // accId が job の userId に紐づくアカウントか確認
  // userDbRepository.findAccountsByUserId で所有アカウント一覧を取得して確認
  const accounts = await userDbRepository.findAccountsByUserId(
    job.userId as UserId,
  );
  const accIdBranded = toAccountId(accId);
  const isOwned = accounts.some((a) => a.id === accIdBranded);
  if (!isOwned) return { ok: false };

  return { ok: true, userId: job.userId as UserId, job };
}

export const playlistOpsRouter = new Hono()
  .use(workerAuth)
  .onError(async (err, c) => {
    Sentry.captureException(err, {
      extra: {
        errorName: err.name,
        errorMessage: err.message,
        errorStack: err.stack,
        // BetterAuth の APIError はステータスコードを持つ
        errorStatus: (err as { status?: unknown }).status,
        errorBody: (err as { body?: unknown }).body,
      },
    });
    await Sentry.flush(2000);
    return c.json({ error: "internal-server-error" }, 500);
  });

// POST /api/v1/playlist-ops/create-playlist
playlistOpsRouter.post("/create-playlist", async (c) => {
  let body: v.InferOutput<typeof CreatePlaylistRequest>;
  try {
    body = v.parse(CreatePlaylistRequest, await c.req.json());
  } catch {
    return badRequest(c);
  }

  const ownership = await verifyAccIdOwnership(body.jobId, body.accId);
  if (!ownership.ok) return forbidden(c);

  // 冪等性チェック：既に完了済みなら既存の playlistId を返す（verifyAccIdOwnership の job を再利用）
  const existingJob = ownership.job;
  const alreadyCompleted =
    existingJob?.result?.completedOpIndices?.includes(body.opIndex) ?? false;
  if (alreadyCompleted && existingJob?.result?.createdPlaylistId) {
    return c.json({ playlistId: existingJob.result.createdPlaylistId });
  }

  const token = await getAccessTokenByAccId(toAccountId(body.accId));
  if (!token) return forbidden(c);

  const repo = new YouTubeRepository(token, toAccountId(body.accId));
  const privacyMap: Record<string, PlaylistPrivacy> = {
    public: PlaylistPrivacy.Public,
    private: PlaylistPrivacy.Private,
    unlisted: PlaylistPrivacy.Unlisted,
  };
  const result = await repo.addPlaylist(
    body.title,
    privacyMap[body.privacy] ?? PlaylistPrivacy.Private,
  );

  if (result.isErr()) {
    Sentry.captureException(result.error);
    return c.json({ error: "youtube-api-error" }, 500);
  }

  await jobsDbRepository.completeCreatePlaylistOperation(
    body.jobId,
    body.opIndex,
    result.value.id,
  );

  return c.json({ playlistId: result.value.id });
});

// POST /api/v1/playlist-ops/add-playlist-item
playlistOpsRouter.post("/add-playlist-item", async (c) => {
  let body: v.InferOutput<typeof AddPlaylistItemRequest>;
  try {
    body = v.parse(AddPlaylistItemRequest, await c.req.json());
  } catch {
    return badRequest(c);
  }

  const ownership = await verifyAccIdOwnership(body.jobId, body.accId);
  if (!ownership.ok) return forbidden(c);

  const token = await getAccessTokenByAccId(toAccountId(body.accId));
  if (!token) return forbidden(c);

  const repo = new YouTubeRepository(token, toAccountId(body.accId));
  const result = await repo.addPlaylistItem(body.playlistId, body.videoId);

  if (result.isErr()) {
    Sentry.captureException(result.error);
    return c.json({ error: "youtube-api-error" }, 500);
  }

  await jobsDbRepository.completeAndCheckOperation(body.jobId, body.opIndex);

  return c.json({ ok: true });
});

// POST /api/v1/playlist-ops/remove-playlist-item
playlistOpsRouter.post("/remove-playlist-item", async (c) => {
  let body: v.InferOutput<typeof RemovePlaylistItemRequest>;
  try {
    body = v.parse(RemovePlaylistItemRequest, await c.req.json());
  } catch {
    return badRequest(c);
  }

  const ownership = await verifyAccIdOwnership(body.jobId, body.accId);
  if (!ownership.ok) return forbidden(c);

  const token = await getAccessTokenByAccId(toAccountId(body.accId));
  if (!token) return forbidden(c);

  const repo = new YouTubeRepository(token, toAccountId(body.accId));
  const result = await repo.removePlaylistItem(body.playlistItemId, "");

  if (result.isErr()) {
    Sentry.captureException(result.error);
    return c.json({ error: "youtube-api-error" }, 500);
  }

  await jobsDbRepository.completeAndCheckOperation(body.jobId, body.opIndex);

  return c.json({ ok: true });
});

// POST /api/v1/playlist-ops/update-playlist-item-position
playlistOpsRouter.post("/update-playlist-item-position", async (c) => {
  let body: v.InferOutput<typeof UpdatePlaylistItemPositionRequest>;
  try {
    body = v.parse(UpdatePlaylistItemPositionRequest, await c.req.json());
  } catch {
    return badRequest(c);
  }

  const ownership = await verifyAccIdOwnership(body.jobId, body.accId);
  if (!ownership.ok) return forbidden(c);

  const token = await getAccessTokenByAccId(toAccountId(body.accId));
  if (!token) return forbidden(c);

  const repo = new YouTubeRepository(token, toAccountId(body.accId));
  const result = await repo.updatePlaylistItemPosition(
    body.playlistItemId,
    body.playlistId,
    body.resourceId,
    body.position,
  );

  if (result.isErr()) {
    Sentry.captureException(result.error);
    return c.json({ error: "youtube-api-error" }, 500);
  }

  await jobsDbRepository.completeAndCheckOperation(body.jobId, body.opIndex);

  return c.json({ ok: true });
});
