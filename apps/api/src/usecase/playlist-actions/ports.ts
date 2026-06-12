import type {
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
  id: string;
  userId: string;
  providerId: string;
  providerAccountId: string;
};

export type AccountAccess = {
  findExecutionAccount(input: {
    accountId: string;
    userId: string;
  }): Promise<ExecutionAccount | null>;
};

export type PlaylistActionJobRecord = {
  id: JobId;
  type: JobType;
  status: JobStatus;
  completeSteps: number;
  totalSteps: number;
  userId: string;
  accountId: string;
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

export type AddPlaylistItemStepDraft = {
  id: StepId;
  jobId: JobId;
  playlistId: string;
  videoId: string;
};

export type PlaylistActionJobRepository = {
  createCreatePlaylistJob(input: {
    accountId: string;
    jobId: JobId;
    planStepId: StepId;
    planStepsPayload: PlanStepsCreatePayload;
    userId: string;
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
};

export type StepQueue = {
  send(message: { stepId: StepId }): Promise<void>;
};

export type ProviderTokenProvider = {
  getAccessToken(input: {
    account: ExecutionAccount;
    userId: string;
  }): Promise<string>;
};

export type PlaylistProviderGateway = {
  createPlaylist(input: {
    accessToken: string;
    name: string;
    privacy: string;
  }): Promise<{ id: string }>;
};
