import "server-only";
import { err, ok, type Result } from "neverthrow";
import { toAccountId } from "@/entities/ids";
import type { FullPlaylist } from "@/features/playlist/entities";
import type { EnqueueJobRequest, JobOperation } from "@/lib/schemas/jobs";
import { getAccessToken } from "@/lib/user";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";

export type ComputeOperationsError =
  | "token-unavailable"
  | "playlist-fetch-failed";

/**
 * EnqueueJobRequest から実行する JobOperation[] を計算する。
 * YouTube API を呼び出してプレイリスト情報を取得し、操作リストを確定する。
 */
export async function computeOperations(
  body: EnqueueJobRequest,
): Promise<Result<JobOperation[], ComputeOperationsError>> {
  switch (body.type) {
    case "copy":
      return computeCopyOperations(body);
    case "merge":
      return computeMergeOperations(body);
    case "extract":
      return computeExtractOperations(body);
    case "deduplicate":
      return computeDeduplicateOperations(body);
    case "shuffle":
      return computeShuffleOperations(body);
  }
}

async function getRepo(
  accId: string,
): Promise<Result<YouTubeRepository, "token-unavailable">> {
  const token = await getAccessToken(toAccountId(accId));
  if (!token) return err("token-unavailable");
  return ok(new YouTubeRepository(token, toAccountId(accId)));
}

async function fetchFull(
  repo: YouTubeRepository,
  playlistId: string,
): Promise<Result<FullPlaylist, "playlist-fetch-failed">> {
  const result = await repo.getFullPlaylist(playlistId);
  if (result.isErr()) return err("playlist-fetch-failed");
  return ok(result.value);
}

async function computeCopyOperations(
  body: Extract<EnqueueJobRequest, { type: "copy" }>,
): Promise<Result<JobOperation[], ComputeOperationsError>> {
  const sourceAccId = body.sourceAccId ?? body.accId;
  const sourceRepoResult = await getRepo(sourceAccId);
  if (sourceRepoResult.isErr()) return err(sourceRepoResult.error);

  const sourceResult = await fetchFull(
    sourceRepoResult.value,
    body.sourcePlaylistId,
  );
  if (sourceResult.isErr()) return err(sourceResult.error);
  const source = sourceResult.value;

  const ops: JobOperation[] = [];
  let opIndex = 0;

  const needCreate = !body.targetPlaylistId;
  const title = body.newPlaylistTitle ?? `${source.title} (copy)`;
  const privacy = body.privacy ?? "private";

  if (needCreate) {
    ops.push({
      opIndex: opIndex++,
      type: "create-playlist",
      accId: body.accId,
      title,
      privacy,
    });
  }

  // dedup: 既存ターゲットプレイリストの videoId 一覧を取得
  let existingVideoIds = new Set<string>();
  if (!body.allowDuplicate && body.targetPlaylistId) {
    const targetRepoResult = await getRepo(body.accId);
    if (targetRepoResult.isOk()) {
      const targetResult = await fetchFull(
        targetRepoResult.value,
        body.targetPlaylistId,
      );
      if (targetResult.isOk()) {
        existingVideoIds = new Set(
          targetResult.value.items.map((i) => i.videoId),
        );
      }
    }
  }

  for (const item of source.items) {
    if (!body.allowDuplicate && existingVideoIds.has(item.videoId)) continue;
    ops.push({
      opIndex: opIndex++,
      type: "add-playlist-item",
      accId: body.accId,
      playlistId: body.targetPlaylistId ?? null,
      videoId: item.videoId,
    });
    existingVideoIds.add(item.videoId);
  }

  return ok(ops);
}

async function computeMergeOperations(
  body: Extract<EnqueueJobRequest, { type: "merge" }>,
): Promise<Result<JobOperation[], ComputeOperationsError>> {
  const ops: JobOperation[] = [];
  let opIndex = 0;

  const needCreate = !body.targetPlaylistId;
  const privacy = body.privacy ?? "private";

  if (needCreate) {
    ops.push({
      opIndex: opIndex++,
      type: "create-playlist",
      accId: body.accId,
      title: body.newPlaylistTitle ?? "New Playlist",
      privacy,
    });
  }

  const existingVideoIds = new Set<string>();

  // 既存ターゲットプレイリストの dedup
  if (!body.allowDuplicate && body.targetPlaylistId) {
    const targetRepoResult = await getRepo(body.accId);
    if (targetRepoResult.isOk()) {
      const targetResult = await fetchFull(
        targetRepoResult.value,
        body.targetPlaylistId,
      );
      if (targetResult.isOk()) {
        for (const i of targetResult.value.items)
          existingVideoIds.add(i.videoId);
      }
    }
  }

  for (const src of body.sourcePlaylists) {
    const sourceRepoResult = await getRepo(src.accId);
    if (sourceRepoResult.isErr()) continue;

    const sourceResult = await fetchFull(sourceRepoResult.value, src.id);
    if (sourceResult.isErr()) continue;

    for (const item of sourceResult.value.items) {
      if (!body.allowDuplicate && existingVideoIds.has(item.videoId)) continue;
      ops.push({
        opIndex: opIndex++,
        type: "add-playlist-item",
        accId: body.accId,
        playlistId: body.targetPlaylistId ?? null,
        videoId: item.videoId,
      });
      existingVideoIds.add(item.videoId);
    }
  }

  return ok(ops);
}

async function computeExtractOperations(
  body: Extract<EnqueueJobRequest, { type: "extract" }>,
): Promise<Result<JobOperation[], ComputeOperationsError>> {
  const ops: JobOperation[] = [];
  let opIndex = 0;

  const needCreate = !body.targetPlaylistId;
  const privacy = body.privacy ?? "private";

  if (needCreate) {
    ops.push({
      opIndex: opIndex++,
      type: "create-playlist",
      accId: body.accId,
      title: body.newPlaylistTitle ?? "New Playlist",
      privacy,
    });
  }

  const existingVideoIds = new Set<string>();
  const artistNamesLower = body.artistNames.map((a) => a.toLowerCase());

  if (!body.allowDuplicate && body.targetPlaylistId) {
    const targetRepoResult = await getRepo(body.accId);
    if (targetRepoResult.isOk()) {
      const targetResult = await fetchFull(
        targetRepoResult.value,
        body.targetPlaylistId,
      );
      if (targetResult.isOk()) {
        for (const i of targetResult.value.items)
          existingVideoIds.add(i.videoId);
      }
    }
  }

  for (const src of body.sourcePlaylists) {
    const sourceRepoResult = await getRepo(src.accId);
    if (sourceRepoResult.isErr()) continue;

    const sourceResult = await fetchFull(sourceRepoResult.value, src.id);
    if (sourceResult.isErr()) continue;

    for (const item of sourceResult.value.items) {
      const authorLower = item.author.toLowerCase();
      const matches = artistNamesLower.some((a) => authorLower.includes(a));
      if (!matches) continue;
      if (!body.allowDuplicate && existingVideoIds.has(item.videoId)) continue;

      ops.push({
        opIndex: opIndex++,
        type: "add-playlist-item",
        accId: body.accId,
        playlistId: body.targetPlaylistId ?? null,
        videoId: item.videoId,
      });
      existingVideoIds.add(item.videoId);
    }
  }

  return ok(ops);
}

async function computeDeduplicateOperations(
  body: Extract<EnqueueJobRequest, { type: "deduplicate" }>,
): Promise<Result<JobOperation[], ComputeOperationsError>> {
  const repoResult = await getRepo(body.accId);
  if (repoResult.isErr()) return err(repoResult.error);

  const playlistResult = await fetchFull(
    repoResult.value,
    body.targetPlaylistId,
  );
  if (playlistResult.isErr()) return err(playlistResult.error);

  const ops: JobOperation[] = [];
  let opIndex = 0;
  const seenVideoIds = new Set<string>();

  for (const item of playlistResult.value.items) {
    if (seenVideoIds.has(item.videoId)) {
      // 重複: 削除
      ops.push({
        opIndex: opIndex++,
        type: "remove-playlist-item",
        accId: body.accId,
        playlistItemId: item.id,
      });
    } else {
      seenVideoIds.add(item.videoId);
    }
  }

  return ok(ops);
}

async function computeShuffleOperations(
  body: Extract<EnqueueJobRequest, { type: "shuffle" }>,
): Promise<Result<JobOperation[], ComputeOperationsError>> {
  const repoResult = await getRepo(body.accId);
  if (repoResult.isErr()) return err(repoResult.error);

  const playlistResult = await fetchFull(
    repoResult.value,
    body.targetPlaylistId,
  );
  if (playlistResult.isErr()) return err(playlistResult.error);

  const ops: JobOperation[] = [];
  const items = [...playlistResult.value.items];
  const ratio = Math.min(1, Math.max(0, body.ratio ?? 0.4));

  // Fisher-Yates partial shuffle
  const shuffleCount = Math.min(items.length, Math.floor(items.length * ratio));
  for (let i = items.length - 1; i > items.length - 1 - shuffleCount; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  for (let newPosition = 0; newPosition < items.length; newPosition++) {
    const item = items[newPosition];
    if (item.position === newPosition) continue; // 変化なし
    ops.push({
      opIndex: ops.length,
      type: "update-playlist-item-position",
      accId: body.accId,
      playlistId: body.targetPlaylistId,
      playlistItemId: item.id,
      resourceId: item.videoId,
      position: newPosition,
    });
  }

  return ok(ops);
}
