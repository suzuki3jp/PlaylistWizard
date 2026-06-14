import type {
  AccountId,
  PlaylistId,
  ProviderAccountId,
  UserId,
  VideoId,
} from "@playlistwizard/core/ids";
import type { PlaylistPrivacy } from "@playlistwizard/core/playlist";
import type { Provider } from "@playlistwizard/core/provider";
import type {
  BackendJob,
  CreatePlaylistStepPayload,
  JobId,
  JobStatus,
  JobType,
  PlanStepsCreatePayload,
  StepId,
  StepStatus,
  StepType,
} from "@playlistwizard/playlist-action-job";

export type IdGenerator = {
  generate(): string;
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

export type PlaylistActionJobRepository = {
  createCreatePlaylistJob(input: {
    accountId: AccountId;
    jobId: JobId;
    planStepId: StepId;
    planStepsPayload: PlanStepsCreatePayload;
    userId: UserId;
  }): Promise<void>;
  markCreatePlaylistJobEnqueueFailed(input: {
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
  completeStep(input: { jobId: JobId; stepId: StepId }): Promise<void>;
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

export type PlaylistProviderGateway = {
  createPlaylist(input: {
    accessToken: string;
    name: string;
    privacy: PlaylistPrivacy;
  }): Promise<{ id: string }>;
};
