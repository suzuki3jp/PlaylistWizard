import {
  toAccountId,
  toPlaylistId,
  toPlaylistItemId,
  toProviderAccountId,
  toUserId,
  toVideoId,
} from "@playlistwizard/core/ids";
import { Provider } from "@playlistwizard/core/provider";
import {
  JobStatus,
  JobType,
  StepStatus,
  StepType,
  toJobId,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AccountAccess,
  IdGenerator,
  JobProgressPublisher,
  PlaylistActionJobRecord,
  PlaylistActionJobRepository,
  PlaylistActionStepRecord,
  PlaylistProviderGateway,
  ProviderTokenProvider,
  StepQueue,
} from "./ports";
import {
  createProcessPlaylistActionDlqMessageUsecase,
  createProcessPlaylistActionStepUsecase,
} from "./process-playlist-action-step";
import { NonRetryableError } from "../../shared/non-retryable-error";

const now = new Date("2026-06-12T00:00:00.000Z");
const accountId = toAccountId("account-id");
const userId = toUserId("user-id");
const jobId = toJobId("job-id");

const createJobRecord = (
  overrides: Partial<PlaylistActionJobRecord> = {},
): PlaylistActionJobRecord => ({
  accountId,
  completeSteps: 0,
  createdAt: now,
  error: null,
  id: jobId,
  status: JobStatus.Running,
  totalSteps: 0,
  type: JobType.Create,
  updatedAt: now,
  userId,
  ...overrides,
});

const createStepRecord = (
  overrides: Partial<PlaylistActionStepRecord>,
): PlaylistActionStepRecord => ({
  attemptCount: 1,
  createdAt: now,
  failedAt: null,
  id: toStepId("step-id"),
  jobId,
  lastError: null,
  payload: {},
  status: StepStatus.Running,
  type: StepType.PlanSteps,
  updatedAt: now,
  ...overrides,
});

const createDeps = () => {
  const accounts: AccountAccess = {
    findExecutionAccount: vi.fn(async () => ({
      id: accountId,
      providerAccountId: toProviderAccountId("provider-account-id"),
      providerId: Provider.GOOGLE,
      userId,
    })),
  };
  const idGenerator: IdGenerator = {
    generateJobId: vi.fn(),
    generateStepId: vi.fn(),
  };
  const jobs: PlaylistActionJobRepository = {
    claimStep: vi.fn(),
    completeStep: vi.fn(async () => undefined),
    createAddPlaylistItemStepsForCreatedPlaylist: vi.fn(async () => undefined),
    createCreatePlaylistStepAndStartJob: vi.fn(async () => undefined),
    createJobWithPlanStep: vi.fn(async () => undefined),
    createPlannedAddPlaylistItemStepsAndStartJob: vi.fn<
      PlaylistActionJobRepository["createPlannedAddPlaylistItemStepsAndStartJob"]
    >(async ({ steps }) =>
      steps.map((step) => ({ id: step.id, status: StepStatus.Pending })),
    ),
    dismissJobs: vi.fn(async () => []),
    failStep: vi.fn(async () => undefined),
    findCreatePlaylistStep: vi.fn(async () => null),
    findExecutionSteps: vi.fn(async () => []),
    findJobStatusesForUser: vi.fn(async () => []),
    findJob: vi.fn(async () => createJobRecord()),
    findSanitizedJobProgressSummariesForUser: vi.fn(async () => []),
    findSanitizedJobProgressSummary: vi.fn(async () => ({
      job: {
        completeSteps: 0,
        id: "job-id",
        status: JobStatus.Running,
        totalSteps: 1,
        type: JobType.Create,
      },
      type: "found" as const,
      userId,
    })),
    findStep: vi.fn(async () => null),
    isStepRunning: vi.fn(async () => false),
    markJobEnqueueFailed: vi.fn(async () => undefined),
    resetRunningStepToPendingWithError: vi.fn(async () => undefined),
    updateRunningAddPlaylistItemPayload: vi.fn(async () => undefined),
    updateRunningCreatePlaylistPayload: vi.fn(async () => undefined),
  };
  const playlistGateway: PlaylistProviderGateway = {
    addPlaylistItem: vi.fn(async () => ({
      id: toPlaylistItemId("added-playlist-item-id"),
    })),
    createPlaylist: vi.fn(async () => ({
      id: toPlaylistId("created-playlist-id"),
    })),
    listPlaylistVideoIds: vi.fn(async () => []),
  };
  const progressPublisher: JobProgressPublisher = {
    publishRemoved: vi.fn(async () => undefined),
    publishUpdated: vi.fn(async () => undefined),
  };
  const stepQueue: StepQueue = {
    send: vi.fn(async () => undefined),
    sendMany: vi.fn(async () => undefined),
  };
  const tokenProvider: ProviderTokenProvider = {
    getAccessToken: vi.fn(async () => "access-token"),
  };

  return {
    accounts,
    idGenerator,
    jobs,
    playlistGateway,
    progressPublisher,
    stepQueue,
    tokenProvider,
  };
};

describe("createProcessPlaylistActionStepUsecase", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("plans a CreatePlaylist step from a PlanSteps Create payload", async () => {
    const deps = createDeps();
    const planStepId = toStepId("plan-step-id");
    const createPlaylistStepId = toStepId("create-playlist-step-id");

    vi.mocked(deps.idGenerator.generateStepId).mockReturnValueOnce(
      createPlaylistStepId,
    );
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(
      createStepRecord({
        id: planStepId,
        payload: {
          playlistName: "New playlist",
          privacy: "private",
        },
        type: StepType.PlanSteps,
      }),
    );

    const usecase = createProcessPlaylistActionStepUsecase(deps);

    await usecase({ stepId: planStepId });

    expect(deps.jobs.createCreatePlaylistStepAndStartJob).toHaveBeenCalledWith({
      jobId,
      payload: {
        name: "New playlist",
        privacy: "private",
      },
      stepId: createPlaylistStepId,
    });
    expect(deps.stepQueue.send).toHaveBeenCalledWith({
      stepId: createPlaylistStepId,
    });
    expect(deps.jobs.completeStep).toHaveBeenCalledWith({
      jobId,
      stepId: planStepId,
    });
  });

  it("plans AddPlaylistItem steps after the provider playlist is created", async () => {
    const deps = createDeps();
    const createPlaylistStepId = toStepId("create-playlist-step-id");
    const firstAddStepId = toStepId("add-step-1");
    const secondAddStepId = toStepId("add-step-2");

    vi.mocked(deps.idGenerator.generateStepId)
      .mockReturnValueOnce(firstAddStepId)
      .mockReturnValueOnce(secondAddStepId);
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(
      createStepRecord({
        id: createPlaylistStepId,
        payload: {
          afterCreate: {
            enqueue: [
              {
                payload: { videoId: "video-1" },
                type: StepType.AddPlaylistItem,
              },
              {
                payload: { videoId: "video-2" },
                type: StepType.AddPlaylistItem,
              },
            ],
          },
          name: "New playlist",
          privacy: "unlisted",
        },
        type: StepType.CreatePlaylist,
      }),
    );

    const usecase = createProcessPlaylistActionStepUsecase(deps);

    await usecase({ stepId: createPlaylistStepId });

    expect(deps.playlistGateway.createPlaylist).toHaveBeenCalledWith({
      accessToken: "access-token",
      name: "New playlist",
      privacy: "unlisted",
    });
    expect(deps.jobs.updateRunningCreatePlaylistPayload).toHaveBeenCalledWith({
      payload: expect.objectContaining({
        createdPlaylistId: "created-playlist-id",
      }),
      stepId: createPlaylistStepId,
    });
    expect(
      deps.jobs.createAddPlaylistItemStepsForCreatedPlaylist,
    ).toHaveBeenCalledWith({
      jobId,
      parentPayload: {
        afterCreate: {
          enqueue: [
            {
              payload: { videoId: "video-1" },
              type: StepType.AddPlaylistItem,
            },
            {
              payload: { videoId: "video-2" },
              type: StepType.AddPlaylistItem,
            },
          ],
        },
        createdPlaylistId: "created-playlist-id",
        name: "New playlist",
        plannedAddPlaylistItemStepIds: [firstAddStepId, secondAddStepId],
        privacy: "unlisted",
      },
      parentStepId: createPlaylistStepId,
      steps: [
        {
          id: firstAddStepId,
          jobId,
          playlistId: "created-playlist-id",
          videoId: "video-1",
        },
        {
          id: secondAddStepId,
          jobId,
          playlistId: "created-playlist-id",
          videoId: "video-2",
        },
      ],
    });
    expect(deps.stepQueue.send).toHaveBeenNthCalledWith(1, {
      stepId: firstAddStepId,
    });
    expect(deps.stepQueue.send).toHaveBeenNthCalledWith(2, {
      stepId: secondAddStepId,
    });
    expect(deps.jobs.completeStep).toHaveBeenCalledWith({
      jobId,
      stepId: createPlaylistStepId,
    });
  });
});

const syncDefinition = {
  version: 1 as const,
  name: "Definition",
  provider: "google" as const,
  playlists: [
    {
      id: "A",
      dependencies: [{ id: "B", dependencies: [{ id: "C" }] }],
    },
    { id: "D", dependencies: [{ id: "C" }] },
  ],
};

const syncPlanStep = (overrides: Partial<PlaylistActionStepRecord> = {}) =>
  createStepRecord({
    id: toStepId("plan-step-id"),
    payload: { definition: syncDefinition },
    type: StepType.PlanSteps,
    ...overrides,
  });

const createSyncDeps = (videoIdsByPlaylist: Record<string, string[]>) => {
  const deps = createDeps();
  let generated = 0;
  vi.mocked(deps.idGenerator.generateStepId).mockImplementation(() =>
    toStepId(`add-step-${++generated}`),
  );
  vi.mocked(deps.jobs.findJob).mockResolvedValue(
    createJobRecord({ status: JobStatus.Pending, type: JobType.Sync }),
  );
  vi.mocked(deps.playlistGateway.listPlaylistVideoIds).mockImplementation(
    async ({ playlistId }) =>
      (videoIdsByPlaylist[playlistId] ?? []).map(toVideoId),
  );
  return deps;
};

describe("createProcessPlaylistActionStepUsecase (Sync)", () => {
  it("reads every Playlist once, persists planned additions, and enqueues them", async () => {
    const deps = createSyncDeps({ A: [], B: [], C: ["X"], D: ["X"] });
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(syncPlanStep());

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("plan-step-id"),
    });

    expect(
      vi
        .mocked(deps.playlistGateway.listPlaylistVideoIds)
        .mock.calls.map(([input]) => input.playlistId),
    ).toEqual(["A", "B", "C", "D"]);
    expect(deps.playlistGateway.listPlaylistVideoIds).toHaveBeenCalledWith({
      accessToken: "access-token",
      playlistId: "A",
    });
    expect(
      deps.jobs.createPlannedAddPlaylistItemStepsAndStartJob,
    ).toHaveBeenCalledWith({
      jobId,
      steps: [
        { id: "add-step-1", jobId, playlistId: "B", videoId: "X" },
        { id: "add-step-2", jobId, playlistId: "A", videoId: "X" },
      ],
    });
    expect(deps.stepQueue.sendMany).toHaveBeenCalledWith([
      { stepId: "add-step-1" },
      { stepId: "add-step-2" },
    ]);
    expect(deps.jobs.completeStep).toHaveBeenCalledWith({
      jobId,
      stepId: "plan-step-id",
    });
  });

  it("re-enqueues only Pending Steps already planned instead of planning again", async () => {
    const deps = createSyncDeps({});
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(syncPlanStep());
    vi.mocked(deps.jobs.findExecutionSteps).mockResolvedValueOnce([
      { id: toStepId("done"), status: StepStatus.Completed },
      { id: toStepId("pending"), status: StepStatus.Pending },
      { id: toStepId("running"), status: StepStatus.Running },
    ]);

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("plan-step-id"),
    });

    expect(deps.playlistGateway.listPlaylistVideoIds).not.toHaveBeenCalled();
    expect(
      deps.jobs.createPlannedAddPlaylistItemStepsAndStartJob,
    ).not.toHaveBeenCalled();
    expect(deps.stepQueue.sendMany).toHaveBeenCalledWith([
      { stepId: "pending" },
    ]);
    expect(deps.jobs.completeStep).toHaveBeenCalled();
  });

  it("completes planning without enqueueing when nothing needs to be added", async () => {
    const deps = createSyncDeps({ A: ["X"], B: ["X"], C: ["X"], D: ["X"] });
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(syncPlanStep());

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("plan-step-id"),
    });

    expect(
      deps.jobs.createPlannedAddPlaylistItemStepsAndStartJob,
    ).toHaveBeenCalledWith({ jobId, steps: [] });
    expect(deps.stepQueue.sendMany).not.toHaveBeenCalled();
    expect(deps.jobs.completeStep).toHaveBeenCalledWith({
      jobId,
      stepId: "plan-step-id",
    });
  });

  it("does not plan from partial data when a Playlist read fails", async () => {
    const deps = createSyncDeps({ A: [] });
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(syncPlanStep());
    vi.mocked(deps.playlistGateway.listPlaylistVideoIds)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("YouTube API error: 503"));

    await expect(
      createProcessPlaylistActionStepUsecase(deps)({
        stepId: toStepId("plan-step-id"),
      }),
    ).rejects.toThrow("YouTube API error: 503");

    expect(
      deps.jobs.createPlannedAddPlaylistItemStepsAndStartJob,
    ).not.toHaveBeenCalled();
    expect(deps.stepQueue.sendMany).not.toHaveBeenCalled();
    expect(deps.jobs.resetRunningStepToPendingWithError).toHaveBeenCalledWith({
      errorMessage: "YouTube API error: 503",
      stepId: "plan-step-id",
    });
    expect(deps.jobs.completeStep).not.toHaveBeenCalled();
  });

  it("fails planning immediately when a Playlist read cannot succeed on retry", async () => {
    const deps = createSyncDeps({});
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(syncPlanStep());
    vi.mocked(deps.playlistGateway.listPlaylistVideoIds).mockRejectedValueOnce(
      new NonRetryableError("YouTube API error: 404 playlistNotFound"),
    );

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("plan-step-id"),
    });

    expect(deps.jobs.failStep).toHaveBeenCalledWith({
      errorMessage: "YouTube API error: 404 playlistNotFound",
      jobId,
      stepId: "plan-step-id",
    });
    expect(
      deps.jobs.createPlannedAddPlaylistItemStepsAndStartJob,
    ).not.toHaveBeenCalled();
    expect(deps.jobs.resetRunningStepToPendingWithError).not.toHaveBeenCalled();
  });

  it("leaves Steps for retry when enqueueing planned Steps fails part-way", async () => {
    const deps = createSyncDeps({ A: [], B: [], C: ["X"], D: ["X"] });
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(syncPlanStep());
    vi.mocked(deps.stepQueue.sendMany).mockRejectedValueOnce(
      new Error("queue unavailable"),
    );

    await expect(
      createProcessPlaylistActionStepUsecase(deps)({
        stepId: toStepId("plan-step-id"),
      }),
    ).rejects.toThrow("queue unavailable");

    expect(deps.jobs.completeStep).not.toHaveBeenCalled();
    expect(deps.jobs.resetRunningStepToPendingWithError).toHaveBeenCalledWith({
      errorMessage: "queue unavailable",
      stepId: "plan-step-id",
    });
  });

  it("rejects an invalid Sync Definition snapshot without Provider calls", async () => {
    const deps = createSyncDeps({});
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(
      syncPlanStep({
        payload: {
          definition: {
            ...syncDefinition,
            playlists: [
              { id: "A", dependencies: [{ id: "B" }] },
              { id: "B", dependencies: [{ id: "A" }] },
            ],
          },
        },
      }),
    );

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("plan-step-id"),
    });

    expect(deps.jobs.failStep).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: expect.stringContaining("Invalid step payload"),
        stepId: "plan-step-id",
      }),
    );
    expect(deps.tokenProvider.getAccessToken).not.toHaveBeenCalled();
  });

  it("does not run a Create PlanSteps payload through the Sync planner", async () => {
    const deps = createSyncDeps({});
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(
      syncPlanStep({
        payload: { playlistName: "New playlist", privacy: "private" },
      }),
    );

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("plan-step-id"),
    });

    expect(deps.jobs.failStep).toHaveBeenCalled();
    expect(
      deps.jobs.createCreatePlaylistStepAndStartJob,
    ).not.toHaveBeenCalled();
  });

  it("fails PlanSteps for Job types without a planner", async () => {
    const deps = createDeps();
    vi.mocked(deps.jobs.findJob).mockResolvedValue(
      createJobRecord({ type: JobType.Shuffle }),
    );
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(
      createStepRecord({ payload: {} }),
    );

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("step-id"),
    });

    expect(deps.jobs.failStep).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: "Unsupported step: PlanSteps for job type Shuffle",
      }),
    );
  });
});

describe("createProcessPlaylistActionStepUsecase (AddPlaylistItem)", () => {
  const addStep = (payload: Record<string, unknown> = {}) =>
    createStepRecord({
      id: toStepId("add-step-id"),
      payload: { playlistId: "target", videoId: "X", ...payload },
      type: StepType.AddPlaylistItem,
    });

  it("adds the Video, records the Provider result, then completes the Step", async () => {
    const deps = createDeps();
    vi.mocked(deps.jobs.findJob).mockResolvedValue(
      createJobRecord({ type: JobType.Sync }),
    );
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(addStep());

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("add-step-id"),
    });

    expect(deps.playlistGateway.addPlaylistItem).toHaveBeenCalledWith({
      accessToken: "access-token",
      playlistId: "target",
      videoId: "X",
    });
    expect(deps.jobs.updateRunningAddPlaylistItemPayload).toHaveBeenCalledWith({
      payload: {
        addedPlaylistItemId: "added-playlist-item-id",
        playlistId: "target",
        videoId: "X",
      },
      stepId: "add-step-id",
    });
    expect(
      vi.mocked(deps.jobs.updateRunningAddPlaylistItemPayload).mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(deps.jobs.completeStep).mock.invocationCallOrder[0],
    );
    expect(deps.jobs.completeStep).toHaveBeenCalledWith({
      jobId,
      stepId: "add-step-id",
    });
  });

  it("completes without adding again when the Provider result is already recorded", async () => {
    const deps = createDeps();
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(
      addStep({ addedPlaylistItemId: "already-added" }),
    );

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("add-step-id"),
    });

    expect(deps.playlistGateway.addPlaylistItem).not.toHaveBeenCalled();
    expect(deps.jobs.completeStep).toHaveBeenCalledWith({
      jobId,
      stepId: "add-step-id",
    });
  });

  it("hands a quota error back to the Queue retry budget", async () => {
    const deps = createDeps();
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(addStep());
    vi.mocked(deps.playlistGateway.addPlaylistItem).mockRejectedValueOnce(
      new Error("YouTube API error: 403 quotaExceeded"),
    );

    await expect(
      createProcessPlaylistActionStepUsecase(deps)({
        stepId: toStepId("add-step-id"),
      }),
    ).rejects.toThrow("quotaExceeded");

    expect(deps.jobs.resetRunningStepToPendingWithError).toHaveBeenCalledWith({
      errorMessage: "YouTube API error: 403 quotaExceeded",
      stepId: "add-step-id",
    });
    expect(deps.jobs.failStep).not.toHaveBeenCalled();
    expect(deps.jobs.completeStep).not.toHaveBeenCalled();
  });

  it("fails the Step without retrying when the Provider rejects it permanently", async () => {
    const deps = createDeps();
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(addStep());
    vi.mocked(deps.playlistGateway.addPlaylistItem).mockRejectedValueOnce(
      new NonRetryableError("YouTube API error: 404 videoNotFound"),
    );

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("add-step-id"),
    });

    expect(deps.jobs.failStep).toHaveBeenCalledWith({
      errorMessage: "YouTube API error: 404 videoNotFound",
      jobId,
      stepId: "add-step-id",
    });
    expect(deps.jobs.resetRunningStepToPendingWithError).not.toHaveBeenCalled();
  });

  it("does nothing for a Step that is not claimable (already completed or leased)", async () => {
    const deps = createDeps();
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(null);

    await createProcessPlaylistActionStepUsecase(deps)({
      stepId: toStepId("add-step-id"),
    });

    expect(deps.playlistGateway.addPlaylistItem).not.toHaveBeenCalled();
    expect(deps.jobs.completeStep).not.toHaveBeenCalled();
  });
});

describe("createProcessPlaylistActionDlqMessageUsecase", () => {
  it("records the final failure of an active Step", async () => {
    const deps = createDeps();
    vi.mocked(deps.jobs.findStep).mockResolvedValueOnce(
      createStepRecord({
        id: toStepId("add-step-id"),
        lastError: "YouTube API error: 403 quotaExceeded",
        status: StepStatus.Pending,
        type: StepType.AddPlaylistItem,
      }),
    );

    await createProcessPlaylistActionDlqMessageUsecase(deps)({
      stepId: toStepId("add-step-id"),
    });

    expect(deps.jobs.failStep).toHaveBeenCalledWith({
      errorMessage:
        "Max retries exceeded: YouTube API error: 403 quotaExceeded",
      jobId,
      stepId: "add-step-id",
    });
  });

  it("ignores a Step that already reached a terminal state", async () => {
    const deps = createDeps();
    vi.mocked(deps.jobs.findStep).mockResolvedValueOnce(
      createStepRecord({ status: StepStatus.Completed }),
    );

    await createProcessPlaylistActionDlqMessageUsecase(deps)({
      stepId: toStepId("step-id"),
    });

    expect(deps.jobs.failStep).not.toHaveBeenCalled();
  });
});
