import type { PlaylistId, VideoId } from "../ids";
import type { PlaylistPrivacy } from "../playlist";

export type CreatePlaylistActionInput = {
  name: string;
  privacy: PlaylistPrivacy;
};

export type CreatePlaylistOperation = {
  name: string;
  privacy: PlaylistPrivacy;
};

export const planCreatePlaylistOperation = (
  input: CreatePlaylistActionInput,
): CreatePlaylistOperation => ({
  name: input.name,
  privacy: input.privacy,
});

export type AddPlaylistItemAfterCreateInput = {
  videoId: VideoId;
};

export type AddPlaylistItemAfterCreateOperation = {
  playlistId: PlaylistId;
  videoId: VideoId;
};

export const planAddPlaylistItemsAfterCreate = (input: {
  createdPlaylistId: PlaylistId;
  items: AddPlaylistItemAfterCreateInput[];
}): AddPlaylistItemAfterCreateOperation[] =>
  input.items.map((item) => ({
    playlistId: input.createdPlaylistId,
    videoId: item.videoId,
  }));
