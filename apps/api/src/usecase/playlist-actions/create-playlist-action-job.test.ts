import type { PlanStepsCreatePayload } from "@playlistwizard/playlist-action-job";
import { describe, expect, it, vi } from "vitest";
import { createCreatePlaylistActionJobUsecase } from "./create-playlist-action-job";
import type {
  AccountAccess,
  IdGenerator,
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
            id: "account-id",
            providerAccountId: "provider-account-id",
            providerId: "google",
            userId: "user-id",
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
    markCreatePlaylistJobEnqueueFailed: vi.fn(async () => undefined),
  } as unknown as PlaylistActionJobRepository;
  const stepQueue: StepQueue = {
    send: vi.fn(async () => {
      if (overrides?.queueError) throw overrides.queueError;
    }),
  };

  return { accounts, idGenerator, jobs, stepQueue };
};

describe("createCreatePlaylistActionJobUsecase", () => {
  it("creates and enqueues a Create playlist action job", async () => {
    const deps = createDeps();
    const usecase = createCreatePlaylistActionJobUsecase(deps);

    await expect(
      usecase({ accountId: "account-id", payload, userId: "user-id" }),
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
  });

  it("returns account_not_found when the Account cannot execute the action", async () => {
    const deps = createDeps({ accountFound: false });
    const usecase = createCreatePlaylistActionJobUsecase(deps);

    await expect(
      usecase({ accountId: "account-id", payload, userId: "user-id" }),
    ).resolves.toEqual({ type: "account_not_found" });

    expect(deps.jobs.createCreatePlaylistJob).not.toHaveBeenCalled();
    expect(deps.stepQueue.send).not.toHaveBeenCalled();
  });

  it("marks the job failed when enqueueing the plan step fails", async () => {
    const deps = createDeps({ queueError: new Error("queue unavailable") });
    const usecase = createCreatePlaylistActionJobUsecase(deps);

    await expect(
      usecase({ accountId: "account-id", payload, userId: "user-id" }),
    ).resolves.toEqual({ type: "enqueue_failed" });

    expect(deps.jobs.markCreatePlaylistJobEnqueueFailed).toHaveBeenCalledWith({
      errorMessage: "Failed to enqueue job: queue unavailable",
      jobId: "job-id",
      planStepId: "plan-step-id",
    });
  });
});
