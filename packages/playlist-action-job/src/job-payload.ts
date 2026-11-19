import * as v from "valibot";
import { JobType, playlistPrivacySchema } from "./job";

export const CreatePlaylistActionPayload = v.object({
  type: v.literal(JobType.Create),
  accountId: v.string(),
  playlistName: v.pipe(v.string(), v.minLength(1)),
  privacy: playlistPrivacySchema,
});
export type CreatePlaylistActionPayload = v.InferOutput<
  typeof CreatePlaylistActionPayload
>;

/**
 * Now we do not support copy playlist over multiple accounts,
 * so we use accountId for both source and target accounts.
 */
export const CopyPlaylistActionPayload = v.object({
  type: v.literal(JobType.Copy),
  accountId: v.string(),
  targetPlaylistId: v.optional(v.string()),
  sourceAccountId: v.string(),
  allowDuplicate: v.boolean(),
});
export type CopyPlaylistActionPayload = v.InferOutput<
  typeof CopyPlaylistActionPayload
>;

export const PlaylistActionPayload = v.variant("type", [
  CreatePlaylistActionPayload,
  CopyPlaylistActionPayload,
]);
export type PlaylistActionPayload = v.InferOutput<typeof PlaylistActionPayload>;
