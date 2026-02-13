import type { Result } from "neverthrow";
import type {
  FullPlaylist,
  Playlist,
  PlaylistItem,
  PlaylistPrivacy,
} from "@/features/playlist/entities";
import type { RepositoryError } from "./errors";

export interface Repository {
  getMyPlaylists(): Promise<Result<Playlist[], RepositoryError>>;

  getFullPlaylist(
    playlistId: string,
  ): Promise<Result<FullPlaylist, RepositoryError>>;

  addPlaylist(
    title: string,
    privacy: PlaylistPrivacy,
  ): Promise<Result<Playlist, RepositoryError>>;

  addPlaylistItem(
    playlistId: string,
    resourceId: string,
  ): Promise<Result<PlaylistItem, RepositoryError>>;

  removePlaylistItem(
    itemId: string,
    playlistId: string,
  ): Promise<Result<void, RepositoryError>>;

  updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
  ): Promise<Result<PlaylistItem, RepositoryError>>;

  deletePlaylist(
    playlistId: string,
  ): Promise<Result<Playlist, RepositoryError>>;
}
