import type { Result } from "neverthrow";

import type {
  AdapterFullPlaylist,
  AdapterPlaylist,
  AdapterPlaylistItem,
  AdapterPlaylistPrivacy,
} from "./entities";

export abstract class BaseAdapter {
  abstract getPlaylists(
    userId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist[], BaseAdapterError>>;

  abstract getFullPlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterFullPlaylist, BaseAdapterError>>;

  abstract addPlaylist(
    title: string,
    status: AdapterPlaylistPrivacy,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, BaseAdapterError>>;

  abstract addPlaylistItem(
    playlistId: string,
    resourceId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylistItem, BaseAdapterError>>;

  abstract updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
    accessToken: string,
  ): Promise<Result<AdapterPlaylistItem, BaseAdapterError>>;

  abstract deletePlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, BaseAdapterError>>;
}

export abstract class BaseAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly status: string,
  ) {
    super(message);
    this.name = "BaseAdapterError";
  }
}
