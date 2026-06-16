import {
  toAccountId,
  toProviderAccountId,
  toUserId,
} from "@playlistwizard/core/ids";
import { Provider } from "@playlistwizard/core/provider";
import type { PlanStepsCreatePayload } from "@playlistwizard/playlist-action-job";
import { describe, expect, it, vi } from "vitest";
import { createCreatePlaylistActionJobUsecase } from "./create-playlist-action-job";
import type {
  AccountAccess,
  IdGenerator,
  JobProgressPublisher,
  PlaylistActionJobRepository,
  StepQueue,
} from "./ports";

const payload: PlanStepsCreatePayload = {
  newPlaylistName: "Created playlist",
  privacy: "private",
};

const createDeps = (overrides?: {
  accountFound?: boolean;
  queueError?: Error;
}) => {
  const accounts: AccountAccess = {
    findExecutionAccount: vi.fn(async () =>
      overrides?.accountFound === false
        ? null
        : {
            id: toAccountId("account-id"),
            providerAccountId: toProviderAccountId("provider-account-id"),
            providerId: Provider.GOOGLE,
            userId: toUserId("user-id"),
          },
    ),
  };
  const idGenerator: IdGenerator = {
    generate: vi
      .fn()
      .mockReturnValueOnce("job-id")
      .mockReturnValueOnce("plan-step-id"),
  };
  const jobs = {
    createCreatePlaylistJob: vi.fn(async () => undefined),
    findSanitizedJobProgressSummary: vi.fn(async () => ({
      job: {
        completeSteps: 0,
        id: "job-id",
        status: "Pending",
        totalSteps: 0,
        type: "Create",
      },
      type: "found",
      userId: toUserId("user-id"),
    })),
    markCreatePlaylistJobEnqueueFailed: vi.fn(async () => undefined),
  } as unknown as PlaylistActionJobRepository;
  const progressPublisher: JobProgressPublisher = {
    publishRemoved: vi.fn(async () => undefined),
    publishUpdated: vi.fn(async () => undefined),
  };
  const stepQueue: StepQueue = {
    send: vi.fn(async () => {
      if (overrides?.queueError) throw overrides.queueError;
    }),
  };

  return { accounts, idGenerator, jobs, progressPublisher, stepQueue };
};

describe("createCreatePlaylistActionJobUsecase", () => {
  it("creates and enqueues a Create playlist action job", async () => {
    const deps = createDeps();
    const usecase = createCreatePlaylistActionJobUsecase(deps);

    await expect(
      usecase({
        accountId: toAccountId("account-id"),
        payload,
        userId: toUserId("user-id"),
      }),
    ).resolves.toEqual({ jobId: "job-id", type: "created" });

    expect(deps.jobs.createCreatePlaylistJob).toHaveBeenCalledWith({
      accountId: "account-id",
      jobId: "job-id",
      planStepId: "plan-step-id",
      planStepsPayload: payload,
      userId: "user-id",
    });
    expect(deps.stepQueue.send).toHaveBeenCalledWith({
      stepId: "plan-step-id",
    });
    expect(deps.progressPublisher.publishUpdated).toHaveBeenCalledWith({
      job: {
        completeSteps: 0,
        id: "job-id",
        status: "Pending",
        totalSteps: 0,
        type: "Create",
      },
      userId: "user-id",
    });
  });

  it("returns account_not_found when the Account cannot execute the action", async () => {
    const deps = createDeps({ accountFound: false });
    const usecase = createCreatePlaylistActionJobUsecase(deps);

    await expect(
      usecase({
        accountId: toAccountId("account-id"),
        payload,
        userId: toUserId("user-id"),
      }),
    ).resolves.toEqual({ type: "account_not_found" });

    expect(deps.jobs.createCreatePlaylistJob).not.toHaveBeenCalled();
    expect(deps.stepQueue.send).not.toHaveBeenCalled();
  });

  it("marks the job failed when enqueueing the plan step fails", async () => {
    const deps = createDeps({ queueError: new Error("queue unavailable") });
    const usecase = createCreatePlaylistActionJobUsecase(deps);

    await expect(
      usecase({
        accountId: toAccountId("account-id"),
        payload,
        userId: toUserId("user-id"),
      }),
    ).resolves.toEqual({ type: "enqueue_failed" });

    expect(deps.jobs.markCreatePlaylistJobEnqueueFailed).toHaveBeenCalledWith({
      errorMessage: "Failed to enqueue job: queue unavailable",
      jobId: "job-id",
      planStepId: "plan-step-id",
    });
  });

  it("keeps job creation successful when progress publishing fails", async () => {
    const deps = createDeps();
    vi.mocked(deps.progressPublisher.publishUpdated).mockRejectedValueOnce(
      new Error("publish unavailable"),
    );
    const usecase = createCreatePlaylistActionJobUsecase(deps);

    await expect(
      usecase({
        accountId: toAccountId("account-id"),
        payload,
        userId: toUserId("user-id"),
      }),
    ).resolves.toEqual({ jobId: "job-id", type: "created" });
  });
});
