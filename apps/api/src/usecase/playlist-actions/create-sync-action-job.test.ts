import {
  toAccountId,
  toProviderAccountId,
  toUserId,
} from "@playlistwizard/core/ids";
import {
  type Provider,
  Provider as Providers,
} from "@playlistwizard/core/provider";
import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import {
  JobType,
  toJobId,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import { describe, expect, it, vi } from "vitest";
import { enqueueSyncActionJobUsecase } from "./create-sync-action-job";
import type {
  AccountAccess,
  IdGenerator,
  JobProgressPublisher,
  PlaylistActionJobRepository,
  StepQueue,
} from "./ports";

const definition: StructuredPlaylistsDefinition = {
  version: 1,
  name: "Definition",
  provider: "google",
  playlists: [{ id: "target", dependencies: [{ id: "source" }] }],
};

const createDeps = (overrides?: {
  accountFound?: boolean;
  providerId?: string;
  queueError?: Error;
}) => {
  const accounts: AccountAccess = {
    findExecutionAccount: vi.fn(async () =>
      overrides?.accountFound === false
        ? null
        : {
            id: toAccountId("account-id"),
            providerAccountId: toProviderAccountId("provider-account-id"),
            providerId: (overrides?.providerId ?? Providers.GOOGLE) as Provider,
            userId: toUserId("user-id"),
          },
    ),
  };
  const idGenerator: IdGenerator = {
    generateJobId: vi.fn().mockReturnValue(toJobId("job-id")),
    generateStepId: vi.fn().mockReturnValue(toStepId("plan-step-id")),
  };
  const jobs = {
    createJobWithPlanStep: vi.fn(async () => undefined),
    findSanitizedJobProgressSummary: vi.fn(async () => ({ type: "not_found" })),
    markJobEnqueueFailed: vi.fn(async () => undefined),
  } as unknown as PlaylistActionJobRepository;
  const progressPublisher: JobProgressPublisher = {
    publishRemoved: vi.fn(async () => undefined),
    publishUpdated: vi.fn(async () => undefined),
  };
  const stepQueue: StepQueue = {
    send: vi.fn(async () => {
      if (overrides?.queueError) throw overrides.queueError;
    }),
    sendMany: vi.fn(async () => undefined),
  };

  return { accounts, idGenerator, jobs, progressPublisher, stepQueue };
};

const command = {
  accountId: toAccountId("account-id"),
  definition,
  userId: toUserId("user-id"),
};

describe("enqueueSyncActionJobUsecase", () => {
  it("snapshots the Definition into the PlanSteps payload and enqueues only the Step ID", async () => {
    const deps = createDeps();

    await expect(enqueueSyncActionJobUsecase(deps)(command)).resolves.toEqual({
      jobId: "job-id",
      type: "created",
    });

    expect(deps.accounts.findExecutionAccount).toHaveBeenCalledWith({
      accountId: "account-id",
      userId: "user-id",
    });
    expect(deps.jobs.createJobWithPlanStep).toHaveBeenCalledWith({
      accountId: "account-id",
      jobId: "job-id",
      jobType: JobType.Sync,
      planStepId: "plan-step-id",
      planStepsPayload: { definition },
      userId: "user-id",
    });
    expect(deps.stepQueue.send).toHaveBeenCalledWith({
      stepId: "plan-step-id",
    });
  });

  it("rejects an Account the User does not own", async () => {
    const deps = createDeps({ accountFound: false });

    await expect(enqueueSyncActionJobUsecase(deps)(command)).resolves.toEqual({
      type: "account_not_found",
    });
    expect(deps.jobs.createJobWithPlanStep).not.toHaveBeenCalled();
    expect(deps.stepQueue.send).not.toHaveBeenCalled();
  });

  it("rejects an Account whose Provider does not match the Definition", async () => {
    const deps = createDeps({ providerId: "spotify" });

    await expect(enqueueSyncActionJobUsecase(deps)(command)).resolves.toEqual({
      type: "provider_mismatch",
    });
    expect(deps.jobs.createJobWithPlanStep).not.toHaveBeenCalled();
  });

  it("marks the Job failed when the first enqueue fails", async () => {
    const deps = createDeps({ queueError: new Error("queue unavailable") });

    await expect(enqueueSyncActionJobUsecase(deps)(command)).resolves.toEqual({
      type: "enqueue_failed",
    });
    expect(deps.jobs.markJobEnqueueFailed).toHaveBeenCalledWith({
      errorMessage: "Failed to enqueue job: queue unavailable",
      jobId: "job-id",
      planStepId: "plan-step-id",
    });
  });
});
