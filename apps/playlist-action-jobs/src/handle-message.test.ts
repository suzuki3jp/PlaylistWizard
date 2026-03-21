import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiClient, WorkerJobResponse } from "./api-client";
import { ApiError } from "./api-client";
import { handleMessage } from "./handle-message";
import type { Env } from "./types";

// Message mock
function makeMsg(
  body: Record<string, unknown>,
  attempts = 1,
): Message<typeof body> {
  return {
    body,
    attempts,
    ack: vi.fn(),
    retry: vi.fn(),
    id: "msg-id",
    timestamp: new Date(),
  } as unknown as Message<typeof body>;
}

function makeEnv(): Env {
  return {
    PLAYLIST_QUEUE: {
      send: vi.fn(),
      sendBatch: vi.fn(),
    } as unknown as Queue<never>,
    WORKER_SECRET: "secret",
    NEXT_APP_URL: "http://localhost:3000",
    SENTRY_DSN: "",
  };
}

function makeJob(
  overrides: Partial<WorkerJobResponse> = {},
): WorkerJobResponse {
  return {
    id: "job-1",
    type: "copy",
    status: "pending",
    progress: 0,
    result: null,
    error: null,
    accId: "acc-1",
    operations: [],
    ...overrides,
  };
}

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getJob: vi.fn().mockResolvedValue(makeJob()),
    getStaleJobs: vi.fn().mockResolvedValue([]),
    updateJobStatus: vi.fn().mockResolvedValue(undefined),
    createPlaylist: vi
      .fn()
      .mockResolvedValue({ playlistId: "new-playlist-id" }),
    addPlaylistItem: vi.fn().mockResolvedValue(undefined),
    removePlaylistItem: vi.fn().mockResolvedValue(undefined),
    updatePlaylistItemPosition: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ApiClient;
}

describe("handleMessage", () => {
  let env: Env;

  beforeEach(() => {
    env = makeEnv();
  });

  it("getJob returns 404 → ack and exit", async () => {
    const api = makeApi({
      getJob: vi.fn().mockRejectedValue(new ApiError(404, "not found")),
    });
    const msg = makeMsg({
      jobId: "job-1",
      opIndex: 0,
      type: "add-playlist-item",
      accId: "acc-1",
      playlistId: "pl-1",
      videoId: "vid-1",
    });

    await handleMessage(msg as never, env, api);

    expect(msg.ack).toHaveBeenCalled();
    expect(msg.retry).not.toHaveBeenCalled();
  });

  it("getJob returns 500 → retry and exit", async () => {
    const api = makeApi({
      getJob: vi.fn().mockRejectedValue(new ApiError(500, "server error")),
    });
    const msg = makeMsg({
      jobId: "job-1",
      opIndex: 0,
      type: "add-playlist-item",
      accId: "acc-1",
      playlistId: "pl-1",
      videoId: "vid-1",
    });

    await handleMessage(msg as never, env, api);

    expect(msg.retry).toHaveBeenCalled();
    expect(msg.ack).not.toHaveBeenCalled();
  });

  it("failed job → ack and skip", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(makeJob({ status: "failed" })),
    });
    const msg = makeMsg({
      jobId: "job-1",
      opIndex: 0,
      type: "add-playlist-item",
      accId: "acc-1",
      playlistId: "pl-1",
      videoId: "vid-1",
    });

    await handleMessage(msg as never, env, api);

    expect(msg.ack).toHaveBeenCalled();
    expect(msg.retry).not.toHaveBeenCalled();
    expect(api.addPlaylistItem).not.toHaveBeenCalled();
  });

  it("cancelled job → ack and skip", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(makeJob({ status: "cancelled" })),
    });
    const msg = makeMsg({
      jobId: "job-1",
      opIndex: 0,
      type: "remove-playlist-item",
      accId: "acc-1",
      playlistItemId: "item-1",
    });

    await handleMessage(msg as never, env, api);

    expect(msg.ack).toHaveBeenCalled();
    expect(api.removePlaylistItem).not.toHaveBeenCalled();
  });

  it("opIndex already in completedOpIndices → ack and skip (idempotency)", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(
        makeJob({
          status: "processing",
          result: { completedOpIndices: [0] },
        }),
      ),
    });
    const msg = makeMsg({
      jobId: "job-1",
      opIndex: 0,
      type: "add-playlist-item",
      accId: "acc-1",
      playlistId: "pl-1",
      videoId: "vid-1",
    });

    await handleMessage(msg as never, env, api);

    expect(msg.ack).toHaveBeenCalled();
    expect(api.addPlaylistItem).not.toHaveBeenCalled();
  });

  it("after create-playlist completes → enqueues add-playlist-item operations", async () => {
    const addOps = [
      {
        opIndex: 1,
        type: "add-playlist-item" as const,
        accId: "acc-1",
        playlistId: null,
        videoId: "vid-1",
      },
      {
        opIndex: 2,
        type: "add-playlist-item" as const,
        accId: "acc-1",
        playlistId: null,
        videoId: "vid-2",
      },
    ];
    const getJob = vi
      .fn()
      .mockResolvedValueOnce(
        makeJob({
          status: "pending",
          operations: [
            {
              opIndex: 0,
              type: "create-playlist",
              accId: "acc-1",
              title: "New PL",
              privacy: "private",
            },
            ...addOps,
          ],
        }),
      )
      .mockResolvedValueOnce(
        makeJob({
          status: "processing",
          result: {
            completedOpIndices: [0],
            createdPlaylistId: "new-playlist-id",
          },
          operations: [
            {
              opIndex: 0,
              type: "create-playlist",
              accId: "acc-1",
              title: "New PL",
              privacy: "private",
            },
            ...addOps,
          ],
        }),
      );

    const api = makeApi({ getJob });
    const msg = makeMsg({
      jobId: "job-1",
      opIndex: 0,
      type: "create-playlist",
      accId: "acc-1",
      title: "New PL",
      privacy: "private",
    });

    await handleMessage(msg as never, env, api);

    expect(api.createPlaylist).toHaveBeenCalledWith({
      jobId: "job-1",
      accId: "acc-1",
      opIndex: 0,
      title: "New PL",
      privacy: "private",
    });
    expect(env.PLAYLIST_QUEUE.sendBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          body: expect.objectContaining({
            type: "add-playlist-item",
            playlistId: "new-playlist-id",
          }),
        }),
      ]),
    );
    expect(msg.ack).toHaveBeenCalled();
  });

  it("429 error → retry({ delaySeconds: 60 })", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(makeJob({ status: "pending" })),
      addPlaylistItem: vi
        .fn()
        .mockRejectedValue(new ApiError(429, "rate limit")),
    });
    const msg = makeMsg(
      {
        jobId: "job-1",
        opIndex: 0,
        type: "add-playlist-item",
        accId: "acc-1",
        playlistId: "pl-1",
        videoId: "vid-1",
      },
      1,
    );

    await handleMessage(msg as never, env, api);

    expect(msg.retry).toHaveBeenCalledWith({ delaySeconds: 60 });
    expect(msg.ack).not.toHaveBeenCalled();
  });

  it("5xx error (attempts < MAX_RETRIES) → retry()", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(makeJob({ status: "pending" })),
      addPlaylistItem: vi
        .fn()
        .mockRejectedValue(new ApiError(500, "server error")),
    });
    const msg = makeMsg(
      {
        jobId: "job-1",
        opIndex: 0,
        type: "add-playlist-item",
        accId: "acc-1",
        playlistId: "pl-1",
        videoId: "vid-1",
      },
      1,
    );

    await handleMessage(msg as never, env, api);

    expect(msg.retry).toHaveBeenCalledWith();
    expect(msg.ack).not.toHaveBeenCalled();
  });

  it("4xx error (non-429) → mark failed → ack", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(makeJob({ status: "pending" })),
      addPlaylistItem: vi
        .fn()
        .mockRejectedValue(new ApiError(403, "forbidden")),
    });
    const msg = makeMsg(
      {
        jobId: "job-1",
        opIndex: 0,
        type: "add-playlist-item",
        accId: "acc-1",
        playlistId: "pl-1",
        videoId: "vid-1",
      },
      1,
    );

    await handleMessage(msg as never, env, api);

    expect(api.updateJobStatus).toHaveBeenCalledWith(
      "job-1",
      "failed",
      expect.any(String),
    );
    expect(msg.ack).toHaveBeenCalled();
    expect(msg.retry).not.toHaveBeenCalled();
  });

  it("unknown error (attempts <= MAX_RETRIES) → retry()", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(makeJob({ status: "pending" })),
      addPlaylistItem: vi.fn().mockRejectedValue(new Error("unexpected")),
    });
    const msg = makeMsg(
      {
        jobId: "job-1",
        opIndex: 0,
        type: "add-playlist-item",
        accId: "acc-1",
        playlistId: "pl-1",
        videoId: "vid-1",
      },
      1,
    );

    await handleMessage(msg as never, env, api);

    expect(msg.retry).toHaveBeenCalledWith();
    expect(msg.ack).not.toHaveBeenCalled();
    expect(api.updateJobStatus).not.toHaveBeenCalledWith(
      expect.anything(),
      "failed",
      expect.anything(),
    );
  });

  it("unknown error (attempts > MAX_RETRIES) → mark failed → ack", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(makeJob({ status: "pending" })),
      addPlaylistItem: vi.fn().mockRejectedValue(new Error("unexpected")),
    });
    const msg = makeMsg(
      {
        jobId: "job-1",
        opIndex: 0,
        type: "add-playlist-item",
        accId: "acc-1",
        playlistId: "pl-1",
        videoId: "vid-1",
      },
      4, // MAX_RETRIES + 1
    );

    await handleMessage(msg as never, env, api);

    expect(api.updateJobStatus).toHaveBeenCalledWith(
      "job-1",
      "failed",
      expect.any(String),
    );
    expect(msg.ack).toHaveBeenCalled();
    expect(msg.retry).not.toHaveBeenCalled();
  });

  it("5xx error (attempts > MAX_RETRIES) → mark failed → ack", async () => {
    const api = makeApi({
      getJob: vi.fn().mockResolvedValue(makeJob({ status: "pending" })),
      addPlaylistItem: vi
        .fn()
        .mockRejectedValue(new ApiError(503, "service unavailable")),
    });
    const msg = makeMsg(
      {
        jobId: "job-1",
        opIndex: 0,
        type: "add-playlist-item",
        accId: "acc-1",
        playlistId: "pl-1",
        videoId: "vid-1",
      },
      4, // MAX_RETRIES + 1 (4th delivery)
    );

    await handleMessage(msg as never, env, api);

    expect(api.updateJobStatus).toHaveBeenCalledWith(
      "job-1",
      "failed",
      expect.any(String),
    );
    expect(msg.ack).toHaveBeenCalled();
    expect(msg.retry).not.toHaveBeenCalled();
  });
});
