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

export const OperationType = {
  Copy: "copy",
  Merge: "merge",
  Extract: "extract",
  Deduplicate: "deduplicate",
  Shuffle: "shuffle",
  CreatePlaylist: "create-playlist",
  AddPlaylistItem: "add-playlist-item",
  RemovePlaylistItem: "remove-playlist-item",
  UpdatePlaylistItemPosition: "update-playlist-item-position",
} as const;
export type OperationType = (typeof OperationType)[keyof typeof OperationType];

export const JobStatus = {
  Pending: "pending",
  Processing: "processing",
  Completed: "completed",
  Failed: "failed",
  Cancelled: "cancelled",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

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

// --- JobOperation ---
// DB に格納される操作リスト。各操作に opIndex と accId を含む。
// add-playlist-item の playlistId は null 可（create-playlist が作成するプレイリストへの参照）

const CreatePlaylistOperation = v.object({
  opIndex: v.number(),
  type: v.literal("create-playlist"),
  accId: v.string(),
  title: v.string(),
  privacy: v.picklist(["public", "private", "unlisted"]),
});

const AddPlaylistItemOperation = v.object({
  opIndex: v.number(),
  type: v.literal("add-playlist-item"),
  accId: v.string(),
  playlistId: v.nullable(v.string()), // null = create-playlist が作成するプレイリスト
  videoId: v.string(),
});

const RemovePlaylistItemOperation = v.object({
  opIndex: v.number(),
  type: v.literal("remove-playlist-item"),
  accId: v.string(),
  playlistItemId: v.string(),
});

const UpdatePlaylistItemPositionOperation = v.object({
  opIndex: v.number(),
  type: v.literal("update-playlist-item-position"),
  accId: v.string(),
  playlistId: v.string(), // YouTube API の PUT /playlistItems に必要
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

// --- JobPayload ---
// DB の payload カラムに格納する型

export type JobPayload = {
  operations: JobOperation[];
};

// --- QueueMessage ---
// Cloudflare Queue に投入するメッセージ形式
// add-playlist-item の playlistId は常に string（create-playlist 完了後に Worker が埋める）

export type QueueMessage = { jobId: string } & (
  | Omit<Extract<JobOperation, { type: "create-playlist" }>, never>
  | (Omit<
      Extract<JobOperation, { type: "add-playlist-item" }>,
      "playlistId"
    > & {
      playlistId: string;
    })
  | Omit<Extract<JobOperation, { type: "remove-playlist-item" }>, never>
  | Omit<
      Extract<JobOperation, { type: "update-playlist-item-position" }>,
      never
    >
);

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
