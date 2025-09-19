// These interfaces are for the music provider repository
// Referenced from the Repository layer according to the Dependency Inversion Principle.

import type { Result } from "neverthrow";
import type {
  FullPlaylist,
  Playlist,
  PlaylistItem,
  PlaylistPrivacy,
} from "@/features/playlist";
import type { SpotifyProviderErrorCode } from "@/repository/providers/spotify";
import type { YoutubeProviderErrorCode } from "@/repository/providers/youtube";

/**
 * Interface for the music provider repository.
 */
export type ProviderRepositoryInterface = {
  getMinePlaylists: (
    accessToken: string,
  ) => Promise<Result<Playlist[], BaseProviderError>>;

  getFullPlaylist: (
    playlistId: string,
    accessToken: string,
  ) => Promise<Result<FullPlaylist, BaseProviderError>>;

  addPlaylist: (
    title: string,
    status: PlaylistPrivacy,
    accessToken: string,
  ) => Promise<Result<Playlist, BaseProviderError>>;

  addPlaylistItem: (
    playlistId: string,
    resourceId: string,
    accessToken: string,
  ) => Promise<Result<PlaylistItem, BaseProviderError>>;

  removePlaylistItem: (
    itemId: string,
    playlistId: string,
    accessToken: string,
  ) => Promise<Result<void, BaseProviderError>>;

  updatePlaylistItemPosition: (
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
    accessToken: string,
  ) => Promise<Result<PlaylistItem, BaseProviderError>>;

  deletePlaylist: (
    playlistId: string,
    accessToken: string,
  ) => Promise<Result<Playlist, BaseProviderError>>;
};

export abstract class BaseProviderError extends Error {
  constructor(
    message: string,
    public readonly code: YoutubeProviderErrorCode | SpotifyProviderErrorCode,
    public readonly status: string,
  ) {
    super(message);
    this.name = "BaseProviderError";
  }
}
