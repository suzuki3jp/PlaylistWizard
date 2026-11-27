import type { AccountId, UserId } from "@playlistwizard/core/ids";
import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { JobType } from "@playlistwizard/playlist-action-job";
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

export type SyncActionJobResult =
  | EnqueuePlanStepResult
  | { type: "account_not_found" }
  | { type: "provider_mismatch" };

export type SyncActionJobCommand = {
  accountId: AccountId;
  /** Definition already accepted by the core Definition rules. */
  definition: StructuredPlaylistsDefinition;
  userId: UserId;
};

/**
 * Enqueues one Sync Job for the whole Definition on one Account. The confirmed
 * Definition is snapshotted into the PlanSteps payload so later edits or a
 * focused Account switch cannot change what this Job does.
 */
export const enqueueSyncActionJobUsecase = (deps: {
  accounts: AccountAccess;
  idGenerator: IdGenerator;
  jobs: PlaylistActionJobRepository;
  progressPublisher: JobProgressPublisher;
  stepQueue: StepQueue;
}) => {
  return async (
    command: SyncActionJobCommand,
  ): Promise<SyncActionJobResult> => {
    const account = await deps.accounts.findExecutionAccount({
      accountId: command.accountId,
      userId: command.userId,
    });

    if (!account) {
      return { type: "account_not_found" };
    }

    if (account.providerId !== command.definition.provider) {
      return { type: "provider_mismatch" };
    }

    return persistJobAndEnqueuePlanStep(deps, {
      accountId: command.accountId,
      jobType: JobType.Sync,
      planStepsPayload: { definition: command.definition },
      userId: command.userId,
    });
  };
};
