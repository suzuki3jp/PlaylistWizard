export type JobType = "copy" | "merge" | "extract" | "deduplicate" | "shuffle";

export const JobStatus = {
  Pending: "pending",
  Processing: "processing",
  Completed: "completed",
  Failed: "failed",
  Cancelled: "cancelled",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

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

export type CreatePlaylistOperation = {
  opIndex: number;
  type: "create-playlist";
  accId: string;
  title: string;
  privacy: "public" | "private" | "unlisted";
};

export type AddPlaylistItemOperation = {
  opIndex: number;
  type: "add-playlist-item";
  accId: string;
  playlistId: string | null;
  videoId: string;
};

export type RemovePlaylistItemOperation = {
  opIndex: number;
  type: "remove-playlist-item";
  accId: string;
  playlistItemId: string;
};

export type UpdatePlaylistItemPositionOperation = {
  opIndex: number;
  type: "update-playlist-item-position";
  accId: string;
  playlistId: string;
  playlistItemId: string;
  resourceId: string;
  position: number;
};

export type JobOperation =
  | CreatePlaylistOperation
  | AddPlaylistItemOperation
  | RemovePlaylistItemOperation
  | UpdatePlaylistItemPositionOperation;

export type JobPayload = {
  operations: JobOperation[];
};

export type JobResult = {
  completedOpIndices: number[];
  createdPlaylistId?: string;
};

// QueueMessage — Cloudflare Queue に投入するメッセージ形式
// add-playlist-item の playlistId は常に string（create-playlist 完了後に Worker が埋める）
export type QueueMessage = { jobId: string } & (
  | CreatePlaylistOperation
  | (Omit<AddPlaylistItemOperation, "playlistId"> & { playlistId: string })
  | RemovePlaylistItemOperation
  | UpdatePlaylistItemPositionOperation
);
