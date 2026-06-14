import type { AccountId, UserId } from "@playlistwizard/core/ids";
import type { PlanStepsCreatePayload } from "@playlistwizard/playlist-action-job";
import { toJobId, toStepId } from "@playlistwizard/playlist-action-job";
import { formatError } from "../../shared/format-error";
import type {
  AccountAccess,
  IdGenerator,
  PlaylistActionJobRepository,
  StepQueue,
} from "./ports";

export type CreatePlaylistActionJobCommand = {
  accountId: AccountId;
  payload: PlanStepsCreatePayload;
  userId: UserId;
};

export type CreatePlaylistActionJobResult =
  | { type: "created"; jobId: string }
  | { type: "account_not_found" }
  | { type: "enqueue_failed" };

export const createCreatePlaylistActionJobUsecase = (deps: {
  accounts: AccountAccess;
  idGenerator: IdGenerator;
  jobs: PlaylistActionJobRepository;
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

    const jobId = toJobId(deps.idGenerator.generate());
    const planStepId = toStepId(deps.idGenerator.generate());

    await deps.jobs.createCreatePlaylistJob({
      accountId: command.accountId,
      jobId,
      planStepId,
      planStepsPayload: command.payload,
      userId: command.userId,
    });

    try {
      await deps.stepQueue.send({ stepId: planStepId });
    } catch (err) {
      await deps.jobs.markCreatePlaylistJobEnqueueFailed({
        errorMessage: `Failed to enqueue job: ${formatError(err)}`,
        jobId,
        planStepId,
      });
      return { type: "enqueue_failed" };
    }

    return { type: "created", jobId };
  };
};
