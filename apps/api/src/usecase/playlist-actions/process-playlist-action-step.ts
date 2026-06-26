import { toPlaylistId, toVideoId } from "@playlistwizard/core/ids";
import {
  planAddPlaylistItemsAfterCreate,
  planCreatePlaylistOperation,
} from "@playlistwizard/core/playlist-actions";
import type {
  CreatePlaylistStepPayload,
  StepQueueMessage,
} from "@playlistwizard/playlist-action-job";
import {
  createPlaylistStepPayloadSchema,
  planStepsCreatePayloadSchema,
  StepStatus,
  StepType,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import { parse, safeParse } from "valibot";
import { formatError } from "../../shared/format-error";
import { publishJobProgressUpdate } from "./job-progress";
import type {
  AccountAccess,
  IdGenerator,
  JobProgressPublisher,
  PlaylistActionJobRepository,
  PlaylistActionStepRecord,
  PlaylistProviderGateway,
  ProviderTokenProvider,
  StepQueue,
} from "./ports";

const STEP_LEASE_MS = 5 * 60 * 1000;

const validateRunningStepPayload = async (
  deps: {
    jobs: PlaylistActionJobRepository;
    progressPublisher: JobProgressPublisher;
  },
  step: PlaylistActionStepRecord,
): Promise<boolean> => {
  if (step.type === StepType.PlanSteps) {
    const result = safeParse(planStepsCreatePayloadSchema, step.payload);
    if (result.success) return true;

    await deps.jobs.failStep({
      errorMessage: `Invalid step payload: ${JSON.stringify(result.issues)}`,
      jobId: step.jobId,
      stepId: step.id,
    });
    await publishJobProgressUpdate(deps, step.jobId);
    return false;
  }

  if (step.type === StepType.CreatePlaylist) {
    const result = safeParse(createPlaylistStepPayloadSchema, step.payload);
    if (result.success) return true;

    await deps.jobs.failStep({
      errorMessage: `Invalid step payload: ${JSON.stringify(result.issues)}`,
      jobId: step.jobId,
      stepId: step.id,
    });
    await publishJobProgressUpdate(deps, step.jobId);
    return false;
  }

  return true;
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
  const job = await deps.jobs.findJob(step.jobId);

  if (!job) throw new Error(`Job not found: ${step.jobId}`);

  const createPayload: CreatePlaylistStepPayload = planCreatePlaylistOperation({
    name: payload.playlistName,
    privacy: payload.privacy,
  });

  const existingCreateStep = await deps.jobs.findCreatePlaylistStep(step.jobId);
  const createPlaylistStepId =
    existingCreateStep?.id ?? toStepId(deps.idGenerator.generate());

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
) => {
  let payload = parse(createPlaylistStepPayloadSchema, step.payload);
  const job = await deps.jobs.findJob(step.jobId);

  if (!job) throw new Error(`Job not found: ${step.jobId}`);

  const account = await deps.accounts.findExecutionAccount({
    accountId: job.accountId,
    userId: job.userId,
  });

  if (!account) throw new Error(`Account not found: ${job.accountId}`);

  const accessToken = await deps.tokenProvider.getAccessToken({
    account,
    userId: job.userId,
  });

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

  let addPlaylistItemStepIds =
    payload.plannedAddPlaylistItemStepIds?.map(toStepId);

  if (!addPlaylistItemStepIds) {
    const addPlaylistItemOperations = planAddPlaylistItemsAfterCreate({
      createdPlaylistId: toPlaylistId(createdPlaylistId),
      items: payload.afterCreate.enqueue.map((item) => ({
        videoId: toVideoId(item.payload.videoId),
      })),
    });

    const addSteps = addPlaylistItemOperations.map((operation) => ({
      id: toStepId(deps.idGenerator.generate()),
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

    if (!step) {
      if (await deps.jobs.isStepRunning(message.stepId)) return;
      return;
    }

    try {
      if (!(await validateRunningStepPayload(deps, step))) return;

      if (step.type === StepType.PlanSteps) {
        const job = await deps.jobs.findJob(step.jobId);
        if (!job) throw new Error(`Job not found: ${step.jobId}`);

        if (job.type === "Create") {
          await executePlanStepsCreate(deps, step);
        } else {
          throw new Error(`Unsupported job type for PlanSteps: ${job.type}`);
        }
      } else if (step.type === StepType.CreatePlaylist) {
        await executeCreatePlaylist(deps, step);
      } else {
        throw new Error(`Unsupported step type: ${step.type}`);
      }

      await deps.jobs.completeStep({ jobId: step.jobId, stepId: step.id });
      await publishJobProgressUpdate(deps, step.jobId);
    } catch (err) {
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
