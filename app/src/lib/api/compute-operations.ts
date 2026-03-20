import "server-only";
import { toAccountId } from "@/entities/ids";
import type { FullPlaylist } from "@/features/playlist/entities";
import type { EnqueueJobRequest, JobOperation } from "@/lib/schemas/jobs";
import { getAccessToken } from "@/lib/user";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";

/**
 * EnqueueJobRequest から実行する JobOperation[] を計算する。
 * YouTube API を呼び出してプレイリスト情報を取得し、操作リストを確定する。
 */
export async function computeOperations(
  body: EnqueueJobRequest,
): Promise<JobOperation[]> {
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

async function getRepo(accId: string): Promise<YouTubeRepository | null> {
  const token = await getAccessToken(toAccountId(accId));
  if (!token) return null;
  return new YouTubeRepository(token, toAccountId(accId));
}

async function fetchFull(
  repo: YouTubeRepository,
  playlistId: string,
): Promise<FullPlaylist | null> {
  const result = await repo.getFullPlaylist(playlistId);
  if (result.isErr()) return null;
  return result.value;
}

async function computeCopyOperations(
  body: Extract<EnqueueJobRequest, { type: "copy" }>,
): Promise<JobOperation[]> {
  const sourceAccId = body.sourceAccId ?? body.accId;
  const sourceRepo = await getRepo(sourceAccId);
  if (!sourceRepo) return [];

  const source = await fetchFull(sourceRepo, body.sourcePlaylistId);
  if (!source) return [];

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
    const targetRepo = await getRepo(body.accId);
    if (targetRepo) {
      const target = await fetchFull(targetRepo, body.targetPlaylistId);
      if (target) {
        existingVideoIds = new Set(target.items.map((i) => i.videoId));
      }
    }
  }

  for (const item of source.items) {
    if (!body.allowDuplicate && existingVideoIds.has(item.videoId)) continue;
    ops.push({
      opIndex: opIndex++,
      type: "add-playlist-item",
      accId: body.accId,
      playlistId: needCreate ? null : body.targetPlaylistId!,
      videoId: item.videoId,
    });
    existingVideoIds.add(item.videoId);
  }

  return ops;
}

async function computeMergeOperations(
  body: Extract<EnqueueJobRequest, { type: "merge" }>,
): Promise<JobOperation[]> {
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
    const targetRepo = await getRepo(body.accId);
    if (targetRepo) {
      const target = await fetchFull(targetRepo, body.targetPlaylistId);
      if (target) {
        for (const i of target.items) existingVideoIds.add(i.videoId);
      }
    }
  }

  for (const src of body.sourcePlaylists) {
    const sourceRepo = await getRepo(src.accId);
    if (!sourceRepo) continue;

    const source = await fetchFull(sourceRepo, src.id);
    if (!source) continue;

    for (const item of source.items) {
      if (!body.allowDuplicate && existingVideoIds.has(item.videoId)) continue;
      ops.push({
        opIndex: opIndex++,
        type: "add-playlist-item",
        accId: body.accId,
        playlistId: needCreate ? null : body.targetPlaylistId!,
        videoId: item.videoId,
      });
      existingVideoIds.add(item.videoId);
    }
  }

  return ops;
}

async function computeExtractOperations(
  body: Extract<EnqueueJobRequest, { type: "extract" }>,
): Promise<JobOperation[]> {
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
    const targetRepo = await getRepo(body.accId);
    if (targetRepo) {
      const target = await fetchFull(targetRepo, body.targetPlaylistId);
      if (target) {
        for (const i of target.items) existingVideoIds.add(i.videoId);
      }
    }
  }

  for (const src of body.sourcePlaylists) {
    const sourceRepo = await getRepo(src.accId);
    if (!sourceRepo) continue;

    const source = await fetchFull(sourceRepo, src.id);
    if (!source) continue;

    for (const item of source.items) {
      const authorLower = item.author.toLowerCase();
      const matches = artistNamesLower.some((a) => authorLower.includes(a));
      if (!matches) continue;
      if (!body.allowDuplicate && existingVideoIds.has(item.videoId)) continue;

      ops.push({
        opIndex: opIndex++,
        type: "add-playlist-item",
        accId: body.accId,
        playlistId: needCreate ? null : body.targetPlaylistId!,
        videoId: item.videoId,
      });
      existingVideoIds.add(item.videoId);
    }
  }

  return ops;
}

async function computeDeduplicateOperations(
  body: Extract<EnqueueJobRequest, { type: "deduplicate" }>,
): Promise<JobOperation[]> {
  const repo = await getRepo(body.accId);
  if (!repo) return [];

  const playlist = await fetchFull(repo, body.targetPlaylistId);
  if (!playlist) return [];

  const ops: JobOperation[] = [];
  let opIndex = 0;
  const seenVideoIds = new Set<string>();

  for (const item of playlist.items) {
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

  return ops;
}

async function computeShuffleOperations(
  body: Extract<EnqueueJobRequest, { type: "shuffle" }>,
): Promise<JobOperation[]> {
  const repo = await getRepo(body.accId);
  if (!repo) return [];

  const playlist = await fetchFull(repo, body.targetPlaylistId);
  if (!playlist) return [];

  const ops: JobOperation[] = [];
  const items = [...playlist.items];
  const ratio = body.ratio ?? 0.4;

  // Fisher-Yates partial shuffle
  const shuffleCount = Math.floor(items.length * ratio);
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

  return ops;
}
