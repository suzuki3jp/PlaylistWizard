import type { JobId } from "./job";

declare const _stepId: unique symbol;
export type StepId = string & { readonly [_stepId]: never };
export const toStepId = (id: string): StepId => id as StepId;

export const StepType = {
  PlanSteps: "PlanSteps",
  CreatePlaylist: "CreatePlaylist",
  AddPlaylistItem: "AddPlaylistItem",
  DeletePlaylistItem: "DeletePlaylistItem",
  MovePlaylistItem: "MovePlaylistItem",
  DeletePlaylist: "DeletePlaylist",
} as const;
export type StepType = (typeof StepType)[keyof typeof StepType];

export const StepStatus = {
  Pending: "Pending",
  Running: "Running",
  Completed: "Completed",
  Failed: "Failed",
} as const;
export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

export type CommonStep = {
  id: StepId;
  jobId: JobId;
  type: StepType;
  status: StepStatus;
  attemptCount: number;
  payload: unknown;
  lastError?: string;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type StepQueueMessage = {
  stepId: StepId;
};

// PlanSteps payload definitions per JobType
export type PlanStepsCreatePayload = {
  newPlaylistName: string;
};

export type PlanStepsPayload = PlanStepsCreatePayload;

export type PlanStepsStep = CommonStep & {
  type: "PlanSteps";
  payload: PlanStepsPayload;
};

// CreatePlaylist
export type CreatePlaylistStepPayload = {
  name: string;
  afterCreate?: {
    enqueue: Array<{
      type: "AddPlaylistItem";
      payload: { videoId: string };
    }>;
  };
};

export type CreatePlaylistStep = CommonStep & {
  type: "CreatePlaylist";
  payload: CreatePlaylistStepPayload;
};

// AddPlaylistItem
export type AddPlaylistItemStep = CommonStep & {
  type: "AddPlaylistItem";
  payload: { playlistId: string; videoId: string };
};

// DeletePlaylistItem
export type DeletePlaylistItemStep = CommonStep & {
  type: "DeletePlaylistItem";
  payload: { playlistId: string; playlistItemId: string };
};

// MovePlaylistItem
export type MovePlaylistItemStep = CommonStep & {
  type: "MovePlaylistItem";
  payload: {
    playlistId: string;
    playlistItemId: string;
    fromIndex: number;
    toIndex: number;
  };
};

// DeletePlaylist
export type DeletePlaylistStep = CommonStep & {
  type: "DeletePlaylist";
  payload: { playlistId: string };
};

export type Step =
  | PlanStepsStep
  | CreatePlaylistStep
  | AddPlaylistItemStep
  | DeletePlaylistItemStep
  | MovePlaylistItemStep
  | DeletePlaylistStep;
