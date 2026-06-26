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

export const PlaylistActionPayload = v.variant("type", [
  CreatePlaylistActionPayload,
]);
export type PlaylistActionPayload = v.InferOutput<typeof PlaylistActionPayload>;
