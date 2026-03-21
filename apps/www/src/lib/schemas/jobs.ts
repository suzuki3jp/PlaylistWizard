import {
  type JobOperation,
  type JobPayload,
  type JobResult,
  JobStatus,
  type JobType,
  OperationType,
  type QueueMessage,
} from "@playlistwizard/job-queue";
import * as v from "valibot";

// Re-export shared types and constants
export { JobStatus, OperationType };
export type { JobType, JobOperation, JobPayload, JobResult, QueueMessage };

// --- Enums ---

export const JobTypeSchema = v.picklist([
  "copy",
  "merge",
  "extract",
  "deduplicate",
  "shuffle",
] as const);

export const JobStatusSchema = v.picklist([
  JobStatus.Pending,
  JobStatus.Processing,
  JobStatus.Completed,
  JobStatus.Failed,
  JobStatus.Cancelled,
]);

// --- EnqueueJobRequest ---

const CopyRequest = v.object({
  type: v.literal("copy"),
  accId: v.string(), // target account
  sourcePlaylistId: v.string(),
  sourceAccId: v.optional(v.string()), // 別アカウントのプレイリストをコピーする場合
  targetPlaylistId: v.optional(v.string()), // 省略時は新規作成
  newPlaylistTitle: v.optional(v.string()), // 未指定時: "{source title} (copy)"
  allowDuplicate: v.optional(v.boolean(), false),
  privacy: v.optional(v.picklist(["public", "private", "unlisted"]), "private"),
});

const MergeRequest = v.object({
  type: v.literal("merge"),
  accId: v.string(),
  sourcePlaylists: v.array(v.object({ id: v.string(), accId: v.string() })),
  targetPlaylistId: v.optional(v.string()),
  newPlaylistTitle: v.optional(v.string()), // 未指定時: "New Playlist"
  allowDuplicate: v.optional(v.boolean(), false),
  privacy: v.optional(v.picklist(["public", "private", "unlisted"]), "private"),
});

const ExtractRequest = v.object({
  type: v.literal("extract"),
  accId: v.string(),
  sourcePlaylists: v.array(v.object({ id: v.string(), accId: v.string() })),
  targetPlaylistId: v.optional(v.string()),
  newPlaylistTitle: v.optional(v.string()), // 未指定時: "New Playlist"
  artistNames: v.array(v.string()),
  allowDuplicate: v.optional(v.boolean(), false),
  privacy: v.optional(v.picklist(["public", "private", "unlisted"]), "private"),
});

const DeduplicateRequest = v.object({
  type: v.literal("deduplicate"),
  accId: v.string(),
  targetPlaylistId: v.string(),
});

const ShuffleRequest = v.object({
  type: v.literal("shuffle"),
  accId: v.string(),
  targetPlaylistId: v.string(),
  ratio: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1)), 0.4),
});

export const EnqueueJobRequest = v.union([
  CopyRequest,
  MergeRequest,
  ExtractRequest,
  DeduplicateRequest,
  ShuffleRequest,
]);
export type EnqueueJobRequest = v.InferOutput<typeof EnqueueJobRequest>;

// --- Internal valibot schemas for JobOperation (runtime validation) ---
// Types are imported from @playlistwizard/job-queue

const CreatePlaylistOperationSchema = v.object({
  opIndex: v.number(),
  type: v.literal("create-playlist"),
  accId: v.string(),
  title: v.string(),
  privacy: v.picklist(["public", "private", "unlisted"]),
});

const AddPlaylistItemOperationSchema = v.object({
  opIndex: v.number(),
  type: v.literal("add-playlist-item"),
  accId: v.string(),
  playlistId: v.nullable(v.string()), // null = create-playlist が作成するプレイリスト
  videoId: v.string(),
});

const RemovePlaylistItemOperationSchema = v.object({
  opIndex: v.number(),
  type: v.literal("remove-playlist-item"),
  accId: v.string(),
  playlistItemId: v.string(),
});

const UpdatePlaylistItemPositionOperationSchema = v.object({
  opIndex: v.number(),
  type: v.literal("update-playlist-item-position"),
  accId: v.string(),
  playlistId: v.string(), // YouTube API の PUT /playlistItems に必要
  playlistItemId: v.string(),
  resourceId: v.string(),
  position: v.number(),
});

const JobOperationSchema = v.union([
  CreatePlaylistOperationSchema,
  AddPlaylistItemOperationSchema,
  RemovePlaylistItemOperationSchema,
  UpdatePlaylistItemPositionOperationSchema,
]);

// --- JobResult ---

export const JobResultSchema = v.object({
  completedOpIndices: v.array(v.number()),
  createdPlaylistId: v.optional(v.string()),
});

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

// --- StaleJobResponse ---
// GET /api/v1/jobs/stale および Worker 向け GET /api/v1/jobs/:id のレスポンス型

export const StaleJobResponse = v.object({
  id: v.string(),
  type: JobTypeSchema,
  status: JobStatusSchema,
  progress: v.number(),
  result: v.nullable(JobResultSchema),
  error: v.nullable(v.string()),
  accId: v.string(),
  operations: v.array(JobOperationSchema),
});
export type StaleJobResponse = v.InferOutput<typeof StaleJobResponse>;
