import type { PlaylistId, VideoId } from "@playlistwizard/core/ids";
import {
  listSyncPlaylistIds,
  planAddPlaylistItemsAfterCreate,
  planCreatePlaylistOperation,
  planSyncAddPlaylistItems,
} from "@playlistwizard/core/playlist-actions";
import type {
  AddPlaylistItemStepPayload,
  CreatePlaylistStepPayload,
  JobType as JobTypeValue,
  StepId,
  StepQueueMessage,
} from "@playlistwizard/playlist-action-job";
import {
  addPlaylistItemStepPayloadSchema,
  createPlaylistStepPayloadSchema,
  JobType,
  planStepsCreatePayloadSchema,
  planStepsSyncPayloadSchema,
  StepStatus,
  StepType,
} from "@playlistwizard/playlist-action-job";
import { type GenericSchema, parse, safeParse } from "valibot";
import { formatError } from "../../shared/format-error";
import { publishJobProgressUpdate } from "./job-progress";
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
import { NonRetryableError } from "../../shared/non-retryable-error";

const STEP_LEASE_MS = 5 * 60 * 1000;

type CreatePlaylistUsecasePayload = Omit<
  CreatePlaylistStepPayload,
  "afterCreate" | "createdPlaylistId" | "plannedAddPlaylistItemStepIds"
> & {
  afterCreate?: {
    enqueue: Array<{
      payload: { videoId: VideoId };
      type: typeof StepType.AddPlaylistItem;
    }>;
  };
  createdPlaylistId?: PlaylistId;
  plannedAddPlaylistItemStepIds?: StepId[];
};

type AddPlaylistItemUsecasePayload = Omit<
  AddPlaylistItemStepPayload,
  "playlistId" | "videoId"
> & {
  playlistId: PlaylistId;
  videoId: VideoId;
};

const parseCreatePlaylistUsecasePayload = (
  payload: unknown,
): CreatePlaylistUsecasePayload => {
  // Branded identifiers are runtime strings. Persisted step payloads are read
  // through the repository boundary; this schema check restores the local
  // payload shape before usecase logic plans follow-up operations.
  return parse(
    createPlaylistStepPayloadSchema,
    payload,
  ) as CreatePlaylistUsecasePayload;
};

const parseAddPlaylistItemUsecasePayload = (
  payload: unknown,
): AddPlaylistItemUsecasePayload =>
  // Same boundary reasoning as parseCreatePlaylistUsecasePayload.
  parse(
    addPlaylistItemStepPayloadSchema,
    payload,
  ) as AddPlaylistItemUsecasePayload;

/**
 * PlanSteps payloads have no discriminator, so the schema is chosen from the
 * parent Job type. Returns null for Job types that have no planner yet.
 */
const getPlanStepsPayloadSchema = (
  jobType: JobTypeValue,
): GenericSchema | null => {
  switch (jobType) {
    case JobType.Create:
      return planStepsCreatePayloadSchema;
    case JobType.Sync:
      return planStepsSyncPayloadSchema;
    default:
      return null;
  }
};

const getStepPayloadSchema = (
  step: PlaylistActionStepRecord,
  job: PlaylistActionJobRecord,
): GenericSchema | null => {
  switch (step.type) {
    case StepType.PlanSteps:
      return getPlanStepsPayloadSchema(job.type);
    case StepType.CreatePlaylist:
      return createPlaylistStepPayloadSchema;
    case StepType.AddPlaylistItem:
      return addPlaylistItemStepPayloadSchema;
    default:
      return null;
  }
};

/**
 * Rejects Steps this Worker cannot execute before any Provider call. Unknown
 * Step/Job types and invalid payloads cannot be fixed by retrying, so they are
 * thrown as permanent failures.
 */
const assertExecutableStep = (
  step: PlaylistActionStepRecord,
  job: PlaylistActionJobRecord,
): void => {
  const schema = getStepPayloadSchema(step, job);
  if (!schema) {
    throw new NonRetryableError(
      `Unsupported step: ${step.type} for job type ${job.type}`,
    );
  }

  const result = safeParse(schema, step.payload);
  if (!result.success) {
    throw new NonRetryableError(
      `Invalid step payload: ${JSON.stringify(result.issues)}`,
    );
  }
};

const executePlanStepsCreate = async (
  deps: {
    idGenerator: IdGenerator;
    jobs: PlaylistActionJobRepository;
    progressPublisher: JobProgressPublisher;
    stepQueue: StepQueue;
  },
  step: PlaylistActionStepRecord,
) => {
  const payload = parse(planStepsCreatePayloadSchema, step.payload);

  const createPayload: CreatePlaylistStepPayload = planCreatePlaylistOperation({
    name: payload.playlistName,
    privacy: payload.privacy,
  });

  const existingCreateStep = await deps.jobs.findCreatePlaylistStep(step.jobId);
  const createPlaylistStepId =
    existingCreateStep?.id ?? deps.idGenerator.generateStepId();

  if (!existingCreateStep) {
    await deps.jobs.createCreatePlaylistStepAndStartJob({
      jobId: step.jobId,
      payload: createPayload,
      stepId: createPlaylistStepId,
    });
    await publishJobProgressUpdate(deps, step.jobId);
  }

  await deps.stepQueue.send({ stepId: createPlaylistStepId });
};

/**
 * Plans a Sync from the Definition snapshot and fans out one AddPlaylistItem
 * Step per planned addition.
 *
 * Every Playlist is read in full before planning; any read failure aborts the
 * plan so additions never start from partial data. Once Steps are persisted, a
 * re-run (retry after a partial enqueue, or redelivery) skips the Provider
 * reads and re-sends the same Pending Step IDs, so Steps and `totalSteps` never
 * grow beyond the first plan.
 */
const executePlanStepsSync = async (
  deps: {
    accounts: AccountAccess;
    idGenerator: IdGenerator;
    jobs: PlaylistActionJobRepository;
    playlistGateway: PlaylistProviderGateway;
    progressPublisher: JobProgressPublisher;
    stepQueue: StepQueue;
    tokenProvider: ProviderTokenProvider;
  },
  step: PlaylistActionStepRecord,
  job: PlaylistActionJobRecord,
) => {
  const { definition } = parse(planStepsSyncPayloadSchema, step.payload);

  let executionSteps = await deps.jobs.findExecutionSteps(step.jobId);

  if (executionSteps.length === 0) {
    const accessToken = await getAccessToken(deps, job);

    const playlistVideoIds = new Map<PlaylistId, VideoId[]>();
    for (const playlistId of listSyncPlaylistIds(definition)) {
      playlistVideoIds.set(
        playlistId,
        await deps.playlistGateway.listPlaylistVideoIds({
          accessToken,
          playlistId,
        }),
      );
    }

    const drafts = planSyncAddPlaylistItems({
      definition,
      playlistVideoIds,
    }).map((operation) => ({
      id: deps.idGenerator.generateStepId(),
      jobId: step.jobId,
      playlistId: operation.playlistId,
      videoId: operation.videoId,
    }));

    executionSteps =
      await deps.jobs.createPlannedAddPlaylistItemStepsAndStartJob({
        jobId: step.jobId,
        steps: drafts,
      });
    await publishJobProgressUpdate(deps, step.jobId);
  }

  const pendingStepIds = executionSteps
    .filter((executionStep) => executionStep.status === StepStatus.Pending)
    .map((executionStep) => ({ stepId: executionStep.id }));

  if (pendingStepIds.length > 0) {
    await deps.stepQueue.sendMany(pendingStepIds);
  }
};

const executeCreatePlaylist = async (
  deps: {
    accounts: AccountAccess;
    idGenerator: IdGenerator;
    jobs: PlaylistActionJobRepository;
    playlistGateway: PlaylistProviderGateway;
    progressPublisher: JobProgressPublisher;
    stepQueue: StepQueue;
    tokenProvider: ProviderTokenProvider;
  },
  step: PlaylistActionStepRecord,
  job: PlaylistActionJobRecord,
) => {
  let payload = parseCreatePlaylistUsecasePayload(step.payload);
  const accessToken = await getAccessToken(deps, job);

  let createdPlaylistId = payload.createdPlaylistId;
  if (!createdPlaylistId) {
    const createdPlaylist = await deps.playlistGateway.createPlaylist({
      accessToken,
      name: payload.name,
      privacy: payload.privacy,
    });
    createdPlaylistId = createdPlaylist.id;
    payload = { ...payload, createdPlaylistId };

    await deps.jobs.updateRunningCreatePlaylistPayload({
      payload,
      stepId: step.id,
    });
  }

  if (!payload.afterCreate?.enqueue?.length) return;

  let addPlaylistItemStepIds = payload.plannedAddPlaylistItemStepIds;

  if (!addPlaylistItemStepIds) {
    const addPlaylistItemOperations = planAddPlaylistItemsAfterCreate({
      createdPlaylistId,
      items: payload.afterCreate.enqueue.map((item) => ({
        videoId: item.payload.videoId,
      })),
    });

    const addSteps = addPlaylistItemOperations.map((operation) => ({
      id: deps.idGenerator.generateStepId(),
      jobId: step.jobId,
      playlistId: operation.playlistId,
      videoId: operation.videoId,
    }));

    addPlaylistItemStepIds = addSteps.map((addStep) => addStep.id);
    payload = {
      ...payload,
      plannedAddPlaylistItemStepIds: addPlaylistItemStepIds,
    };

    await deps.jobs.createAddPlaylistItemStepsForCreatedPlaylist({
      jobId: step.jobId,
      parentPayload: payload,
      parentStepId: step.id,
      steps: addSteps,
    });
    await publishJobProgressUpdate(deps, step.jobId);
  }

  for (const addPlaylistItemStepId of addPlaylistItemStepIds) {
    await deps.stepQueue.send({ stepId: addPlaylistItemStepId });
  }
};

/**
 * Inserts one Video into one Playlist.
 *
 * The Provider insert and the DB completion cannot share a transaction. The
 * Provider's Playlist Item ID is recorded on the Step right after the insert,
 * and a redelivered Step that already has it completes without inserting
 * again. A crash after the Provider accepted the insert but before that record
 * is written can still produce one duplicate insert on retry; this is not an
 * exactly-once guarantee. Checking the target Playlist for the Video before
 * retrying is not an option because Sync intentionally plans repeated
 * additions of the same Video.
 */
const executeAddPlaylistItem = async (
  deps: {
    accounts: AccountAccess;
    jobs: PlaylistActionJobRepository;
    playlistGateway: PlaylistProviderGateway;
    tokenProvider: ProviderTokenProvider;
  },
  step: PlaylistActionStepRecord,
  job: PlaylistActionJobRecord,
) => {
  const payload = parseAddPlaylistItemUsecasePayload(step.payload);
  if (payload.addedPlaylistItemId) return;

  const accessToken = await getAccessToken(deps, job);
  const added = await deps.playlistGateway.addPlaylistItem({
    accessToken,
    playlistId: payload.playlistId,
    videoId: payload.videoId,
  });

  await deps.jobs.updateRunningAddPlaylistItemPayload({
    payload: { ...payload, addedPlaylistItemId: added.id },
    stepId: step.id,
  });
};

/**
 * Resolves the Provider token for the Job's own User and Account. Execution
 * never uses identity from the Queue message or the browser.
 */
const getAccessToken = async (
  deps: {
    accounts: AccountAccess;
    tokenProvider: ProviderTokenProvider;
  },
  job: PlaylistActionJobRecord,
): Promise<string> => {
  const account = await deps.accounts.findExecutionAccount({
    accountId: job.accountId,
    userId: job.userId,
  });

  if (!account) {
    throw new NonRetryableError(`Account not found: ${job.accountId}`);
  }

  return deps.tokenProvider.getAccessToken({
    account,
    userId: job.userId,
  });
};

/**
 * Processes one Step message. Retryable errors put the Step back to Pending and
 * rethrow so the Queue retries it within its bounded budget (the DLQ consumer
 * records the final failure). `NonRetryableError`s fail the Step immediately
 * and are acknowledged.
 */
export const createProcessPlaylistActionStepUsecase = (deps: {
  accounts: AccountAccess;
  idGenerator: IdGenerator;
  jobs: PlaylistActionJobRepository;
  playlistGateway: PlaylistProviderGateway;
  progressPublisher: JobProgressPublisher;
  stepQueue: StepQueue;
  tokenProvider: ProviderTokenProvider;
}) => {
  return async (message: StepQueueMessage): Promise<void> => {
    const step = await deps.jobs.claimStep({
      staleBefore: new Date(Date.now() - STEP_LEASE_MS),
      stepId: message.stepId,
    });

    // Completed, failed, or actively leased Steps are not executed again.
    if (!step) return;

    try {
      const job = await deps.jobs.findJob(step.jobId);
      if (!job) throw new Error(`Job not found: ${step.jobId}`);

      assertExecutableStep(step, job);

      if (step.type === StepType.PlanSteps) {
        if (job.type === JobType.Sync) {
          await executePlanStepsSync(deps, step, job);
        } else {
          await executePlanStepsCreate(deps, step);
        }
      } else if (step.type === StepType.CreatePlaylist) {
        await executeCreatePlaylist(deps, step, job);
      } else {
        await executeAddPlaylistItem(deps, step, job);
      }

      await deps.jobs.completeStep({ jobId: step.jobId, stepId: step.id });
      await publishJobProgressUpdate(deps, step.jobId);
    } catch (err) {
      if (err instanceof NonRetryableError) {
        await deps.jobs.failStep({
          errorMessage: formatError(err),
          jobId: step.jobId,
          stepId: step.id,
        });
        await publishJobProgressUpdate(deps, step.jobId);
        return;
      }

      await deps.jobs.resetRunningStepToPendingWithError({
        errorMessage: formatError(err),
        stepId: step.id,
      });
      throw err;
    }
  };
};

export const createProcessPlaylistActionDlqMessageUsecase = (deps: {
  jobs: PlaylistActionJobRepository;
  progressPublisher: JobProgressPublisher;
}) => {
  return async (message: StepQueueMessage): Promise<void> => {
    const step = await deps.jobs.findStep(message.stepId);

    if (!step) return;

    if (
      step.status !== StepStatus.Pending &&
      step.status !== StepStatus.Running
    ) {
      return;
    }

    const errorMessage = step.lastError
      ? `Max retries exceeded: ${step.lastError}`
      : "Max retries exceeded";

    await deps.jobs.failStep({
      errorMessage,
      jobId: step.jobId,
      stepId: step.id,
    });
    await publishJobProgressUpdate(deps, step.jobId);
  };
};
