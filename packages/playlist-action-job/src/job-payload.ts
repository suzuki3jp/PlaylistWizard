import * as v from "valibot";
import { JobType, playlistPrivacySchema } from "./job";
import { structuredPlaylistsDefinitionSchema } from "./structured-playlists-definition";

export const CreatePlaylistActionPayload = v.object({
  type: v.literal(JobType.Create),
  accountId: v.string(),
  playlistName: v.pipe(v.string(), v.minLength(1)),
  privacy: playlistPrivacySchema,
});
export type CreatePlaylistActionPayload = v.InferOutput<
  typeof CreatePlaylistActionPayload
>;

export const SyncPlaylistActionPayload = v.object({
  type: v.literal(JobType.Sync),
  accountId: v.string(),
  definition: structuredPlaylistsDefinitionSchema,
});
export type SyncPlaylistActionPayload = v.InferOutput<
  typeof SyncPlaylistActionPayload
>;

export const PlaylistActionPayload = v.variant("type", [
  CreatePlaylistActionPayload,
  SyncPlaylistActionPayload,
]);
export type PlaylistActionPayload = v.InferOutput<typeof PlaylistActionPayload>;
