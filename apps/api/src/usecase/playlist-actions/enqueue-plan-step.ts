import type { AccountId, UserId } from "@playlistwizard/core/ids";
import { formatError } from "../../shared/format-error";
import { publishJobProgressUpdate } from "./job-progress";
import type {
  IdGenerator,
  JobProgressPublisher,
  PlanStepsJobDraft,
  PlaylistActionJobRepository,
  StepQueue,
} from "./ports";

export type EnqueuePlanStepResult =
  | { type: "created"; jobId: string }
  | { type: "enqueue_failed" };

/**
 * Persists a Job with its PlanSteps Step and hands only the Step ID to the
 * Queue. If the first send fails the Job is marked Failed immediately so it is
 * never left Pending without a message that would ever process it.
 */
export const persistJobAndEnqueuePlanStep = async (
  deps: {
    idGenerator: IdGenerator;
    jobs: PlaylistActionJobRepository;
    progressPublisher: JobProgressPublisher;
    stepQueue: StepQueue;
  },
  input: PlanStepsJobDraft & { accountId: AccountId; userId: UserId },
): Promise<EnqueuePlanStepResult> => {
  const jobId = deps.idGenerator.generateJobId();
  const planStepId = deps.idGenerator.generateStepId();

  await deps.jobs.createJobWithPlanStep({ ...input, jobId, planStepId });
  await publishJobProgressUpdate(deps, jobId);

  try {
    await deps.stepQueue.send({ stepId: planStepId });
  } catch (err) {
    await deps.jobs.markJobEnqueueFailed({
      errorMessage: `Failed to enqueue job: ${formatError(err)}`,
      jobId,
      planStepId,
    });
    await publishJobProgressUpdate(deps, jobId);
    return { type: "enqueue_failed" };
  }

  return { type: "created", jobId };
};
