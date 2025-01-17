import type { Result } from "result4js";

import type { BaseAdapterError } from "./BaseAdapterError";
import type {
    FullPlaylist,
    Playlist,
    PlaylistItem,
    PlaylistPrivacy,
} from "./entities";

export abstract class BaseAdapter {
    abstract getPlaylists(
        userId: string,
        accessToken: string,
    ): Promise<Result<Playlist[], BaseAdapterError>>;

    abstract getPlaylist(
        playlistId: string,
        accessToken: string,
    ): Promise<Result<Playlist, BaseAdapterError>>;

    abstract getFullPlaylist(
        playlistId: string,
        accessToken: string,
    ): Promise<Result<FullPlaylist, BaseAdapterError>>;

    abstract addPlaylist(
        title: string,
        status: PlaylistPrivacy,
        accessToken: string,
    ): Promise<Result<Playlist, BaseAdapterError>>;

    abstract addPlaylistItem(
        playlistId: string,
        resourceId: string,
        accessToken: string,
    ): Promise<Result<PlaylistItem, BaseAdapterError>>;

    abstract updatePlaylistItemPosition(
        itemId: string,
        playlistId: string,
        resourceId: string,
        position: number,
        accessToken: string,
    ): Promise<Result<PlaylistItem, BaseAdapterError>>;

    abstract deletePlaylist(
        playlistId: string,
        accessToken: string,
    ): Promise<Result<Playlist, BaseAdapterError>>;
}
