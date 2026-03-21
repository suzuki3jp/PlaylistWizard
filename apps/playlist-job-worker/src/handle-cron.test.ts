import { describe, expect, it, vi } from "vitest";
import type { ApiClient, WorkerJobResponse } from "./api-client";
import { handleCron } from "./handle-cron";
import type { Env } from "./types";

function makeEnv(): Env {
  return {
    PLAYLIST_QUEUE: {
      send: vi.fn().mockResolvedValue(undefined),
      sendBatch: vi.fn().mockResolvedValue(undefined),
    } as unknown as Queue<never>,
    WORKER_SECRET: "secret",
    NEXT_APP_URL: "http://localhost:3000",
  };
}

function makeJob(
  overrides: Partial<WorkerJobResponse> = {},
): WorkerJobResponse {
  return {
    id: "job-1",
    type: "copy",
    status: "processing",
    progress: 0,
    result: null,
    error: null,
    accId: "acc-1",
    operations: [],
    ...overrides,
  };
}

function makeApi(staleJobs: WorkerJobResponse[]): ApiClient {
  return {
    getJob: vi.fn(),
    getStaleJobs: vi.fn().mockResolvedValue(staleJobs),
    updateJobStatus: vi.fn(),
    updateJobResult: vi.fn(),
    createPlaylist: vi.fn(),
    addPlaylistItem: vi.fn(),
    removePlaylistItem: vi.fn(),
    updatePlaylistItemPosition: vi.fn(),
  } as unknown as ApiClient;
}

describe("handleCron", () => {
  it("create-playlist 未完了ジョブ → create-playlist のみ再投入する", async () => {
    const env = makeEnv();
    const job = makeJob({
      operations: [
        {
          opIndex: 0,
          type: "create-playlist",
          accId: "acc-1",
          title: "New PL",
          privacy: "private",
        },
        {
          opIndex: 1,
          type: "add-playlist-item",
          accId: "acc-1",
          playlistId: null,
          videoId: "vid-1",
        },
      ],
      result: null,
    });
    const api = makeApi([job]);

    await handleCron(env, api);

    expect(env.PLAYLIST_QUEUE.send).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-1",
        type: "create-playlist",
        opIndex: 0,
      }),
    );
    expect(env.PLAYLIST_QUEUE.sendBatch).not.toHaveBeenCalled();
  });

  it("create-playlist 完了済み → 残り操作を playlistId 補完して再投入する", async () => {
    const env = makeEnv();
    const job = makeJob({
      operations: [
        {
          opIndex: 0,
          type: "create-playlist",
          accId: "acc-1",
          title: "New PL",
          privacy: "private",
        },
        {
          opIndex: 1,
          type: "add-playlist-item",
          accId: "acc-1",
          playlistId: null,
          videoId: "vid-1",
        },
        {
          opIndex: 2,
          type: "add-playlist-item",
          accId: "acc-1",
          playlistId: null,
          videoId: "vid-2",
        },
      ],
      result: {
        completedOpIndices: [0],
        createdPlaylistId: "created-pl-id",
      },
    });
    const api = makeApi([job]);

    await handleCron(env, api);

    expect(env.PLAYLIST_QUEUE.send).not.toHaveBeenCalled();
    expect(env.PLAYLIST_QUEUE.sendBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          body: expect.objectContaining({
            type: "add-playlist-item",
            playlistId: "created-pl-id",
            videoId: "vid-1",
          }),
        }),
        expect.objectContaining({
          body: expect.objectContaining({
            type: "add-playlist-item",
            playlistId: "created-pl-id",
            videoId: "vid-2",
          }),
        }),
      ]),
    );
  });

  it("全操作完了済みジョブ → 再投入しない（スキップ）", async () => {
    const env = makeEnv();
    const job = makeJob({
      operations: [
        {
          opIndex: 0,
          type: "add-playlist-item",
          accId: "acc-1",
          playlistId: "pl-1",
          videoId: "vid-1",
        },
      ],
      result: { completedOpIndices: [0] },
    });
    const api = makeApi([job]);

    await handleCron(env, api);

    expect(env.PLAYLIST_QUEUE.send).not.toHaveBeenCalled();
    expect(env.PLAYLIST_QUEUE.sendBatch).not.toHaveBeenCalled();
  });

  it("ストールジョブが空 → 何もしない", async () => {
    const env = makeEnv();
    const api = makeApi([]);

    await handleCron(env, api);

    expect(env.PLAYLIST_QUEUE.send).not.toHaveBeenCalled();
    expect(env.PLAYLIST_QUEUE.sendBatch).not.toHaveBeenCalled();
  });

  it("1ジョブがエラーでも残りのジョブを継続処理する", async () => {
    const env = makeEnv();
    const failingJob = makeJob({
      id: "job-fail",
      operations: [
        {
          opIndex: 0,
          type: "add-playlist-item",
          accId: "acc-1",
          playlistId: "pl-1",
          videoId: "vid-fail",
        },
      ],
      result: null,
    });
    const okJob = makeJob({
      id: "job-ok",
      operations: [
        {
          opIndex: 0,
          type: "add-playlist-item",
          accId: "acc-1",
          playlistId: "pl-ok",
          videoId: "vid-ok",
        },
      ],
      result: null,
    });

    const api = makeApi([failingJob, okJob]);
    // failingJob 処理時に sendBatch を失敗させる
    const sendBatch = vi
      .fn()
      .mockRejectedValueOnce(new Error("queue error"))
      .mockResolvedValueOnce(undefined);
    env.PLAYLIST_QUEUE.sendBatch = sendBatch;

    await handleCron(env, api);

    // okJob の sendBatch が呼ばれていることを確認
    expect(sendBatch).toHaveBeenCalledTimes(2);
    expect(sendBatch).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          body: expect.objectContaining({ videoId: "vid-ok" }),
        }),
      ]),
    );
  });
});
