import * as v from "valibot";
import { type JobId, playlistPrivacySchema } from "./job";
import { enumValues } from "./schema-utils";

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

export const stepTypeSchema = v.picklist(enumValues(StepType));
export type StepType = v.InferOutput<typeof stepTypeSchema>;

export const StepStatus = {
  Pending: "Pending",
  Running: "Running",
  Completed: "Completed",
  Failed: "Failed",
} as const;

export const stepStatusSchema = v.picklist(enumValues(StepStatus));
export type StepStatus = v.InferOutput<typeof stepStatusSchema>;

export const stepQueueMessageSchema = v.object({
  stepId: v.string(),
});

export type StepQueueMessageInput = v.InferOutput<
  typeof stepQueueMessageSchema
>;

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
export const planStepsCreatePayloadSchema = v.object({
  newPlaylistName: v.pipe(v.string(), v.minLength(1)),
  privacy: playlistPrivacySchema,
});

export type PlanStepsCreatePayload = v.InferOutput<
  typeof planStepsCreatePayloadSchema
>;

export const planStepsPayloadSchema = planStepsCreatePayloadSchema;

export type PlanStepsPayload = v.InferOutput<typeof planStepsPayloadSchema>;

export type PlanStepsStep = CommonStep & {
  type: typeof StepType.PlanSteps;
  payload: PlanStepsPayload;
};

// CreatePlaylist
export const addPlaylistItemAfterCreatePayloadSchema = v.object({
  videoId: v.string(),
});

export const createPlaylistStepPayloadSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  privacy: playlistPrivacySchema,
  createdPlaylistId: v.optional(v.string()),
  plannedAddPlaylistItemStepIds: v.optional(v.array(v.string())),
  afterCreate: v.optional(
    v.object({
      enqueue: v.array(
        v.object({
          type: v.literal(StepType.AddPlaylistItem),
          payload: addPlaylistItemAfterCreatePayloadSchema,
        }),
      ),
    }),
  ),
});

export type CreatePlaylistStepPayload = v.InferOutput<
  typeof createPlaylistStepPayloadSchema
>;

export type CreatePlaylistStep = CommonStep & {
  type: typeof StepType.CreatePlaylist;
  payload: CreatePlaylistStepPayload;
};

export const addPlaylistItemStepPayloadSchema = v.object({
  playlistId: v.string(),
  videoId: v.string(),
});

export const deletePlaylistItemStepPayloadSchema = v.object({
  playlistId: v.string(),
  playlistItemId: v.string(),
});

export const movePlaylistItemStepPayloadSchema = v.object({
  playlistId: v.string(),
  playlistItemId: v.string(),
  fromIndex: v.pipe(v.number(), v.integer()),
  toIndex: v.pipe(v.number(), v.integer()),
});

export const deletePlaylistStepPayloadSchema = v.object({
  playlistId: v.string(),
});

export const stepPayloadSchema = v.union([
  planStepsPayloadSchema,
  createPlaylistStepPayloadSchema,
  addPlaylistItemStepPayloadSchema,
  deletePlaylistItemStepPayloadSchema,
  movePlaylistItemStepPayloadSchema,
  deletePlaylistStepPayloadSchema,
]);

export type AddPlaylistItemStepPayload = v.InferOutput<
  typeof addPlaylistItemStepPayloadSchema
>;

export type DeletePlaylistItemStepPayload = v.InferOutput<
  typeof deletePlaylistItemStepPayloadSchema
>;

export type MovePlaylistItemStepPayload = v.InferOutput<
  typeof movePlaylistItemStepPayloadSchema
>;

export type DeletePlaylistStepPayload = v.InferOutput<
  typeof deletePlaylistStepPayloadSchema
>;

export type StepPayload = v.InferOutput<typeof stepPayloadSchema>;

// AddPlaylistItem
export type AddPlaylistItemStep = CommonStep & {
  type: typeof StepType.AddPlaylistItem;
  payload: AddPlaylistItemStepPayload;
};

// DeletePlaylistItem
export type DeletePlaylistItemStep = CommonStep & {
  type: typeof StepType.DeletePlaylistItem;
  payload: DeletePlaylistItemStepPayload;
};

// MovePlaylistItem
export type MovePlaylistItemStep = CommonStep & {
  type: typeof StepType.MovePlaylistItem;
  payload: MovePlaylistItemStepPayload;
};

// DeletePlaylist
export type DeletePlaylistStep = CommonStep & {
  type: typeof StepType.DeletePlaylist;
  payload: DeletePlaylistStepPayload;
};

export type Step =
  | PlanStepsStep
  | CreatePlaylistStep
  | AddPlaylistItemStep
  | DeletePlaylistItemStep
  | MovePlaylistItemStep
  | DeletePlaylistStep;
