import type {
  AccountId,
  PlaylistId,
  PlaylistItemId,
  ProviderAccountId,
  UserId,
  VideoId,
} from "@playlistwizard/core/ids";
import type { PlaylistPrivacy } from "@playlistwizard/core/playlist";
import type { Provider } from "@playlistwizard/core/provider";
import type {
  AddPlaylistItemStepPayload,
  BackendJob,
  CreatePlaylistStepPayload,
  JobId,
  JobStatus,
  JobType,
  PlanStepsCreatePayload,
  PlanStepsSyncPayload,
  StepId,
  StepStatus,
  StepType,
} from "@playlistwizard/playlist-action-job";

export type IdGenerator = {
  generateJobId(): JobId;
  generateStepId(): StepId;
};

export type ExecutionAccount = {
  id: AccountId;
  userId: UserId;
  providerId: Provider;
  providerAccountId: ProviderAccountId;
};

export type AccountAccess = {
  findExecutionAccount(input: {
    accountId: AccountId;
    userId: UserId;
  }): Promise<ExecutionAccount | null>;
};

export type PlaylistActionJobRecord = {
  id: JobId;
  type: JobType;
  status: JobStatus;
  completeSteps: number;
  totalSteps: number;
  userId: UserId;
  accountId: AccountId;
  error: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type PlaylistActionStepRecord = {
  id: StepId;
  jobId: JobId;
  type: StepType;
  status: StepStatus;
  attemptCount: number;
  payload: unknown;
  lastError: string | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SanitizedJobProgressSummaryResult =
  | { type: "found"; userId: UserId; job: BackendJob }
  | { type: "not_found" }
  | { type: "invalid"; error: unknown };

export type JobStatusRecord = {
  id: JobId;
  status: JobStatus;
};

export type AddPlaylistItemStepDraft = {
  id: StepId;
  jobId: JobId;
  playlistId: PlaylistId;
  videoId: VideoId;
};

export type ExecutionStepRecord = {
  id: StepId;
  status: StepStatus;
};

export type PlanStepsJobDraft =
  | { jobType: typeof JobType.Create; planStepsPayload: PlanStepsCreatePayload }
  | { jobType: typeof JobType.Sync; planStepsPayload: PlanStepsSyncPayload };

/**
 * Persistence for Playlist Action Jobs and their Steps.
 *
 * Job terminal state is derived from Step state: a Job becomes `Completed` or
 * `Failed` only once every Step (including PlanSteps) is terminal, and `Failed`
 * wins when any Step failed. Implementations must make that settlement atomic
 * per Job so concurrent Step completions cannot overwrite each other.
 */
export type PlaylistActionJobRepository = {
  /** Persists a Pending Job together with its first PlanSteps Step. */
  createJobWithPlanStep(
    input: PlanStepsJobDraft & {
      accountId: AccountId;
      jobId: JobId;
      planStepId: StepId;
      userId: UserId;
    },
  ): Promise<void>;
  markJobEnqueueFailed(input: {
    errorMessage: string;
    jobId: JobId;
    planStepId: StepId;
  }): Promise<void>;
  claimStep(input: {
    staleBefore: Date;
    stepId: StepId;
  }): Promise<PlaylistActionStepRecord | null>;
  isStepRunning(stepId: StepId): Promise<boolean>;
  findStep(stepId: StepId): Promise<PlaylistActionStepRecord | null>;
  findJob(jobId: JobId): Promise<PlaylistActionJobRecord | null>;
  /**
   * Completes a Running Step once. Non-PlanSteps completions count toward the
   * Job's `completeSteps`, and the Job settles when no Step remains active.
   */
  completeStep(input: { jobId: JobId; stepId: StepId }): Promise<void>;
  /**
   * Records the final failure of an active Step and settles the Job. A failed PlanSteps also
   * fails execution Steps that have not started, so a terminal Job never has
   * work left to run.
   */
  failStep(input: {
    errorMessage: string;
    jobId: JobId;
    stepId: StepId;
  }): Promise<void>;
  resetRunningStepToPendingWithError(input: {
    errorMessage: string;
    stepId: StepId;
  }): Promise<void>;
  findCreatePlaylistStep(
    jobId: JobId,
  ): Promise<PlaylistActionStepRecord | null>;
  createCreatePlaylistStepAndStartJob(input: {
    jobId: JobId;
    stepId: StepId;
    payload: CreatePlaylistStepPayload;
  }): Promise<void>;
  updateRunningCreatePlaylistPayload(input: {
    payload: CreatePlaylistStepPayload;
    stepId: StepId;
  }): Promise<void>;
  createAddPlaylistItemStepsForCreatedPlaylist(input: {
    jobId: JobId;
    parentStepId: StepId;
    parentPayload: CreatePlaylistStepPayload;
    steps: AddPlaylistItemStepDraft[];
  }): Promise<void>;
  /** Lists every non-PlanSteps Step already planned for the Job. */
  findExecutionSteps(jobId: JobId): Promise<ExecutionStepRecord[]>;
  /**
   * Persists planned AddPlaylistItem Steps, sets `totalSteps` to their count,
   * and marks the Job Running in one transaction. When execution Steps already
   * exist (a concurrent or repeated plan won), nothing is inserted and the
   * existing Steps are returned so callers re-enqueue the same IDs.
   */
  createPlannedAddPlaylistItemStepsAndStartJob(input: {
    jobId: JobId;
    steps: AddPlaylistItemStepDraft[];
  }): Promise<ExecutionStepRecord[]>;
  updateRunningAddPlaylistItemPayload(input: {
    payload: AddPlaylistItemStepPayload;
    stepId: StepId;
  }): Promise<void>;
  findSanitizedJobProgressSummary(
    jobId: JobId,
  ): Promise<SanitizedJobProgressSummaryResult>;
  findSanitizedJobProgressSummariesForUser(
    userId: UserId,
  ): Promise<BackendJob[]>;
  findJobStatusesForUser(input: {
    jobIds: JobId[];
    userId: UserId;
  }): Promise<JobStatusRecord[]>;
  dismissJobs(input: { jobIds: JobId[]; userId: UserId }): Promise<JobId[]>;
};

export type StepQueue = {
  send(message: { stepId: StepId }): Promise<void>;
  /**
   * Sends many Step messages. It may fail after sending only some of them, so
   * callers must be able to re-send the same Step IDs.
   */
  sendMany(messages: { stepId: StepId }[]): Promise<void>;
};

export type JobProgressPublisher = {
  publishUpdated(input: { job: BackendJob; userId: UserId }): Promise<void>;
  publishRemoved(input: { jobId: JobId; userId: UserId }): Promise<void>;
};

export type ProviderTokenProvider = {
  getAccessToken(input: {
    account: ExecutionAccount;
    userId: UserId;
  }): Promise<string>;
};

/**
 * Provider operations used by Step execution. Errors that retrying cannot fix
 * are thrown as `NonRetryableError`; other errors are treated as retryable.
 */
export type PlaylistProviderGateway = {
  createPlaylist(input: {
    accessToken: string;
    name: string;
    privacy: PlaylistPrivacy;
  }): Promise<{ id: PlaylistId }>;
  /** Reads the Video IDs of every page of a Playlist's items, in order. */
  listPlaylistVideoIds(input: {
    accessToken: string;
    playlistId: PlaylistId;
  }): Promise<VideoId[]>;
  addPlaylistItem(input: {
    accessToken: string;
    playlistId: PlaylistId;
    videoId: VideoId;
  }): Promise<{ id: PlaylistItemId }>;
};
