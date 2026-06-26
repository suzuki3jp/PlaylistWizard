import { toAccountId, type UserId } from "@playlistwizard/core/ids";
import type { CreatePlaylistActionPayload } from "@playlistwizard/playlist-action-job";
import { toJobId, toStepId } from "@playlistwizard/playlist-action-job";
import { formatError } from "../../shared/format-error";
import { publishJobProgressUpdate } from "./job-progress";
import type {
  AccountAccess,
  IdGenerator,
  JobProgressPublisher,
  PlaylistActionJobRepository,
  StepQueue,
} from "./ports";

export type CreatePlaylistActionJobResult =
  | { type: "created"; jobId: string }
  | { type: "account_not_found" }
  | { type: "enqueue_failed" };

/** Enqueues a Create Job while keeping HTTP action fields out of PlanSteps payloads. */
export const enqueueCreatePlaylistActionJobUsecase = (deps: {
  accounts: AccountAccess;
  idGenerator: IdGenerator;
  jobs: PlaylistActionJobRepository;
  progressPublisher: JobProgressPublisher;
  stepQueue: StepQueue;
}) => {
  return async (
    command: CreatePlaylistActionPayload & { userId: UserId },
  ): Promise<CreatePlaylistActionJobResult> => {
    const accountId = toAccountId(command.accountId);
    const account = await deps.accounts.findExecutionAccount({
      accountId,
      userId: command.userId,
    });

    if (!account) {
      return { type: "account_not_found" };
    }

    const jobId = toJobId(deps.idGenerator.generate());
    const planStepId = toStepId(deps.idGenerator.generate());

    await deps.jobs.createCreatePlaylistJob({
      accountId,
      jobId,
      planStepId,
      planStepsPayload: {
        playlistName: command.playlistName,
        privacy: command.privacy,
      },
      userId: command.userId,
    });
    await publishJobProgressUpdate(deps, jobId);

    try {
      await deps.stepQueue.send({ stepId: planStepId });
    } catch (err) {
      await deps.jobs.markCreatePlaylistJobEnqueueFailed({
        errorMessage: `Failed to enqueue job: ${formatError(err)}`,
        jobId,
        planStepId,
      });
      await publishJobProgressUpdate(deps, jobId);
      return { type: "enqueue_failed" };
    }

    return { type: "created", jobId };
  };
};
