import {
  toAccountId,
  toProviderAccountId,
  toUserId,
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
import { createProcessPlaylistActionStepUsecase } from "./process-playlist-action-step";

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
    generate: vi.fn(),
  };
  const jobs: PlaylistActionJobRepository = {
    claimStep: vi.fn(),
    completeStep: vi.fn(async () => undefined),
    createAddPlaylistItemStepsForCreatedPlaylist: vi.fn(async () => undefined),
    createCreatePlaylistJob: vi.fn(async () => undefined),
    createCreatePlaylistStepAndStartJob: vi.fn(async () => undefined),
    dismissJobs: vi.fn(async () => []),
    failStep: vi.fn(async () => undefined),
    findCreatePlaylistStep: vi.fn(async () => null),
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
    markCreatePlaylistJobEnqueueFailed: vi.fn(async () => undefined),
    resetRunningStepToPendingWithError: vi.fn(async () => undefined),
    updateRunningCreatePlaylistPayload: vi.fn(async () => undefined),
  };
  const playlistGateway: PlaylistProviderGateway = {
    createPlaylist: vi.fn(async () => ({ id: "created-playlist-id" })),
  };
  const progressPublisher: JobProgressPublisher = {
    publishRemoved: vi.fn(async () => undefined),
    publishUpdated: vi.fn(async () => undefined),
  };
  const stepQueue: StepQueue = {
    send: vi.fn(async () => undefined),
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

    vi.mocked(deps.idGenerator.generate).mockReturnValueOnce(
      createPlaylistStepId,
    );
    vi.mocked(deps.jobs.claimStep).mockResolvedValueOnce(
      createStepRecord({
        id: planStepId,
        payload: {
          newPlaylistName: "New playlist",
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

    vi.mocked(deps.idGenerator.generate)
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
