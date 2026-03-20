import "server-only";
import { Hono } from "hono";
import * as v from "valibot";
import type { UserId } from "@/entities/ids";
import { toAccountId } from "@/entities/ids";
import { PlaylistPrivacy } from "@/features/playlist/entities";
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
 */
async function verifyAccIdOwnership(
  jobId: string,
  accId: string,
): Promise<{ ok: true; userId: UserId } | { ok: false }> {
  const job = await jobsDbRepository.getJobByWorker(jobId);
  if (!job) return { ok: false };

  // accId が job の userId に紐づくアカウントか確認
  // userDbRepository.findAccountsByUserId で所有アカウント一覧を取得して確認
  const accounts = await userDbRepository.findAccountsByUserId(
    job.userId as UserId,
  );
  const ownedIds = new Set(accounts.map((a) => a.id as string));
  if (!ownedIds.has(accId)) return { ok: false };

  return { ok: true, userId: job.userId as UserId };
}

/**
 * completeOperation を呼んだ後、全操作完了チェックを行い、完了なら status を 'completed' にする。
 */
async function completeOpAndCheck(
  jobId: string,
  opIndex: number,
): Promise<void> {
  await jobsDbRepository.completeOperation(jobId, opIndex);

  const updated = await jobsDbRepository.getJobByWorker(jobId);
  if (!updated) return;

  const completedCount = updated.result?.completedOpIndices?.length ?? 0;
  if (completedCount >= updated.totalOpCount) {
    await jobsDbRepository.updateJobStatus(jobId, "completed");
  }
}

export const playlistOpsRouter = new Hono().use(workerAuth);

// POST /api/v1/playlist-ops/create-playlist
playlistOpsRouter.post("/create-playlist", async (c) => {
  let body: v.InferOutput<typeof CreatePlaylistRequest>;
  try {
    body = v.parse(CreatePlaylistRequest, await c.req.json());
  } catch {
    return c.json({ error: "Bad Request" }, 400);
  }

  const ownership = await verifyAccIdOwnership(body.jobId, body.accId);
  if (!ownership.ok) return c.json({ error: "Forbidden" }, 403);

  const token = await getAccessTokenByAccId(toAccountId(body.accId));
  if (!token) return c.json({ error: "Forbidden" }, 403);

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
    return c.json({ error: result.error.message }, 500);
  }

  await completeOpAndCheck(body.jobId, body.opIndex);

  return c.json({ playlistId: result.value.id });
});

// POST /api/v1/playlist-ops/add-playlist-item
playlistOpsRouter.post("/add-playlist-item", async (c) => {
  let body: v.InferOutput<typeof AddPlaylistItemRequest>;
  try {
    body = v.parse(AddPlaylistItemRequest, await c.req.json());
  } catch {
    return c.json({ error: "Bad Request" }, 400);
  }

  const ownership = await verifyAccIdOwnership(body.jobId, body.accId);
  if (!ownership.ok) return c.json({ error: "Forbidden" }, 403);

  const token = await getAccessTokenByAccId(toAccountId(body.accId));
  if (!token) return c.json({ error: "Forbidden" }, 403);

  const repo = new YouTubeRepository(token, toAccountId(body.accId));
  const result = await repo.addPlaylistItem(body.playlistId, body.videoId);

  if (result.isErr()) {
    return c.json({ error: result.error.message }, 500);
  }

  await completeOpAndCheck(body.jobId, body.opIndex);

  return c.json({ ok: true });
});

// POST /api/v1/playlist-ops/remove-playlist-item
playlistOpsRouter.post("/remove-playlist-item", async (c) => {
  let body: v.InferOutput<typeof RemovePlaylistItemRequest>;
  try {
    body = v.parse(RemovePlaylistItemRequest, await c.req.json());
  } catch {
    return c.json({ error: "Bad Request" }, 400);
  }

  const ownership = await verifyAccIdOwnership(body.jobId, body.accId);
  if (!ownership.ok) return c.json({ error: "Forbidden" }, 403);

  const token = await getAccessTokenByAccId(toAccountId(body.accId));
  if (!token) return c.json({ error: "Forbidden" }, 403);

  const repo = new YouTubeRepository(token, toAccountId(body.accId));
  // YouTubeRepository.removePlaylistItem の第2引数 _playlistId は未使用（YouTube API の DELETE は itemId のみ必要）
  const result = await repo.removePlaylistItem(body.playlistItemId, "");

  if (result.isErr()) {
    return c.json({ error: result.error.message }, 500);
  }

  await completeOpAndCheck(body.jobId, body.opIndex);

  return c.json({ ok: true });
});

// POST /api/v1/playlist-ops/update-playlist-item-position
playlistOpsRouter.post("/update-playlist-item-position", async (c) => {
  let body: v.InferOutput<typeof UpdatePlaylistItemPositionRequest>;
  try {
    body = v.parse(UpdatePlaylistItemPositionRequest, await c.req.json());
  } catch {
    return c.json({ error: "Bad Request" }, 400);
  }

  const ownership = await verifyAccIdOwnership(body.jobId, body.accId);
  if (!ownership.ok) return c.json({ error: "Forbidden" }, 403);

  const token = await getAccessTokenByAccId(toAccountId(body.accId));
  if (!token) return c.json({ error: "Forbidden" }, 403);

  const repo = new YouTubeRepository(token, toAccountId(body.accId));
  const result = await repo.updatePlaylistItemPosition(
    body.playlistItemId,
    body.playlistId,
    body.resourceId,
    body.position,
  );

  if (result.isErr()) {
    return c.json({ error: result.error.message }, 500);
  }

  await completeOpAndCheck(body.jobId, body.opIndex);

  return c.json({ ok: true });
});
