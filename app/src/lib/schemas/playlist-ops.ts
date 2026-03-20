import * as v from "valibot";

export const CreatePlaylistRequest = v.object({
  jobId: v.string(),
  accId: v.string(),
  opIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
  title: v.string(),
  privacy: v.picklist(["public", "private", "unlisted"]),
});
export type CreatePlaylistRequest = v.InferOutput<typeof CreatePlaylistRequest>;

export const AddPlaylistItemRequest = v.object({
  jobId: v.string(),
  accId: v.string(),
  opIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
  playlistId: v.string(),
  videoId: v.string(),
});
export type AddPlaylistItemRequest = v.InferOutput<
  typeof AddPlaylistItemRequest
>;

export const RemovePlaylistItemRequest = v.object({
  jobId: v.string(),
  accId: v.string(),
  opIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
  playlistItemId: v.string(),
});
export type RemovePlaylistItemRequest = v.InferOutput<
  typeof RemovePlaylistItemRequest
>;

export const UpdatePlaylistItemPositionRequest = v.object({
  jobId: v.string(),
  accId: v.string(),
  opIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
  playlistId: v.string(),
  playlistItemId: v.string(),
  resourceId: v.string(),
  position: v.number(),
});
export type UpdatePlaylistItemPositionRequest = v.InferOutput<
  typeof UpdatePlaylistItemPositionRequest
>;
