import * as v from "valibot";

// --- Enums ---

export const JobTypeSchema = v.picklist([
  "copy",
  "merge",
  "extract",
  "deduplicate",
  "shuffle",
]);
export type JobType = v.InferOutput<typeof JobTypeSchema>;

export const JobStatusSchema = v.picklist([
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);
export type JobStatus = v.InferOutput<typeof JobStatusSchema>;

// --- EnqueueJobRequest ---

const CopyRequest = v.object({
  type: v.literal("copy"),
  accId: v.string(),
  sourceId: v.string(),
  targetId: v.string(),
  allowDuplicates: v.boolean(),
});

const MergeRequest = v.object({
  type: v.literal("merge"),
  accId: v.string(),
  sourceIds: v.array(v.string()),
  targetId: v.string(),
  allowDuplicates: v.boolean(),
});

const ExtractRequest = v.object({
  type: v.literal("extract"),
  accId: v.string(),
  sourceId: v.string(),
  itemIds: v.array(v.string()),
});

const DeduplicateRequest = v.object({
  type: v.literal("deduplicate"),
  accId: v.string(),
  playlistId: v.string(),
});

const ShuffleRequest = v.object({
  type: v.literal("shuffle"),
  accId: v.string(),
  playlistId: v.string(),
});

export const EnqueueJobRequest = v.union([
  CopyRequest,
  MergeRequest,
  ExtractRequest,
  DeduplicateRequest,
  ShuffleRequest,
]);
export type EnqueueJobRequest = v.InferOutput<typeof EnqueueJobRequest>;

// --- JobOperation ---

const CreatePlaylistOperation = v.object({
  type: v.literal("create-playlist"),
  title: v.string(),
  privacy: v.picklist(["public", "private", "unlisted"]),
});

const AddPlaylistItemOperation = v.object({
  type: v.literal("add-playlist-item"),
  playlistId: v.string(),
  videoId: v.string(),
});

const RemovePlaylistItemOperation = v.object({
  type: v.literal("remove-playlist-item"),
  playlistItemId: v.string(),
});

const UpdatePlaylistItemPositionOperation = v.object({
  type: v.literal("update-playlist-item-position"),
  playlistItemId: v.string(),
  resourceId: v.string(),
  position: v.number(),
});

export const JobOperation = v.union([
  CreatePlaylistOperation,
  AddPlaylistItemOperation,
  RemovePlaylistItemOperation,
  UpdatePlaylistItemPositionOperation,
]);
export type JobOperation = v.InferOutput<typeof JobOperation>;

// --- JobResult ---

export const JobResultSchema = v.object({
  completedOpIndices: v.array(v.number()),
  createdPlaylistId: v.optional(v.string()),
});
export type JobResult = v.InferOutput<typeof JobResultSchema>;

// --- JobResponse ---

export const JobResponse = v.object({
  id: v.string(),
  type: JobTypeSchema,
  status: JobStatusSchema,
  progress: v.number(),
  result: v.nullable(JobResultSchema),
  error: v.nullable(v.string()),
});
export type JobResponse = v.InferOutput<typeof JobResponse>;
