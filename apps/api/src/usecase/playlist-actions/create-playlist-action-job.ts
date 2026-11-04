import type { AccountId, UserId } from "@playlistwizard/core/ids";
import {
  type CreatePlaylistActionPayload,
  JobType,
} from "@playlistwizard/playlist-action-job";
import {
  type EnqueuePlanStepResult,
  persistJobAndEnqueuePlanStep,
} from "./enqueue-plan-step";
import type {
  AccountAccess,
  IdGenerator,
  JobProgressPublisher,
  PlaylistActionJobRepository,
  StepQueue,
} from "./ports";

export type CreatePlaylistActionJobResult =
  | EnqueuePlanStepResult
  | { type: "account_not_found" };

export type CreatePlaylistActionJobCommand = Omit<
  CreatePlaylistActionPayload,
  "accountId" | "type"
> & {
  accountId: AccountId;
  userId: UserId;
};

/** Enqueues a Create Job while keeping HTTP action fields out of PlanSteps payloads. */
export const enqueueCreatePlaylistActionJobUsecase = (deps: {
  accounts: AccountAccess;
  idGenerator: IdGenerator;
  jobs: PlaylistActionJobRepository;
  progressPublisher: JobProgressPublisher;
  stepQueue: StepQueue;
}) => {
  return async (
    command: CreatePlaylistActionJobCommand,
  ): Promise<CreatePlaylistActionJobResult> => {
    const account = await deps.accounts.findExecutionAccount({
      accountId: command.accountId,
      userId: command.userId,
    });

    if (!account) {
      return { type: "account_not_found" };
    }

    return persistJobAndEnqueuePlanStep(deps, {
      accountId: command.accountId,
      jobType: JobType.Create,
      planStepsPayload: {
        playlistName: command.playlistName,
        privacy: command.privacy,
      },
      userId: command.userId,
    });
  };
};
