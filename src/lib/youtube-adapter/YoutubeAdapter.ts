import type { GaxiosError } from "gaxios";

import {
    BaseAdapter,
    FullPlaylist,
    type Playlist,
    type PlaylistItem,
} from "@/lib/base-adapter";
import { Err, Ok, type Result } from "@/lib/result";
import {
    convertToPlaylist,
    convertToPlaylistItem,
} from "@/lib/youtube-adapter/EntityConverter";
import {
    YoutubeAdapterErrorCodes as ErrorCodes,
    YoutubeAdapterError,
    makeError,
} from "@/lib/youtube-adapter/YoutubeAdapterError";
import { YoutubeApiClient } from "@/lib/youtube-adapter/YoutubeApiClient";

export class YoutubeAdapter extends BaseAdapter {
    private client: YoutubeApiClient;

    constructor() {
        super();
        this.client = new YoutubeApiClient();
    }

    async getPlaylists(
        accessToken: string,
    ): Promise<Result<Playlist[], YoutubeAdapterError>> {
        try {
            let playlists: Playlist[] = [];
            let nextPageToken: string | null | undefined = "";

            do {
                const res = await this.client.getPlaylists(
                    accessToken,
                    nextPageToken,
                );
                if (!res.items) throw makeError("UNKNOWN_ERROR");
                const items = res.items?.map((item) => convertToPlaylist(item));
                playlists = playlists.concat(items);
                nextPageToken = res.nextPageToken;
            } while (nextPageToken);

            return Ok(playlists);
        } catch (error) {
            return Err(this.handleError(error));
        }
    }

    async getFullPlaylist(
        playlistId: string,
        accessToken: string,
    ): Promise<Result<FullPlaylist, YoutubeAdapterError>> {
        const items: PlaylistItem[] = [];
        let nextPageToken: string | undefined = undefined;

        try {
            const result = await this.getPlaylist(playlistId, accessToken);
            if (result.isFailure()) throw result.data;
            const playlist = result.data;

            do {
                const res = await this.client.getPlaylistItemsByPlaylistId(
                    playlistId,
                    accessToken,
                    nextPageToken,
                );

                if (!res.items) throw makeError("UNKNOWN_ERROR");

                const gotItems = res.items
                    ?.map((item) => convertToPlaylistItem(item))
                    .filter((item) => item !== null);
                items.push(...gotItems);

                nextPageToken = res.nextPageToken ?? undefined;
            } while (nextPageToken);

            const obj = new FullPlaylist({
                id: playlist.getId,
                title: playlist.getTitle,
                thumbnailUrl: playlist.getThumbnailUrl,
                itemsTotal: playlist.getItemsTotal,
                items,
            });
            return Ok(obj);
        } catch (error) {
            return Err(this.handleError(error));
        }
    }

    async getPlaylist(
        playlistId: string,
        accessToken: string,
    ): Promise<Result<Playlist, YoutubeAdapterError>> {
        try {
            const res = await this.client.getPlaylistByPlaylistId(
                playlistId,
                accessToken,
            );

            if (!res.items) throw makeError("UNKNOWN_ERROR");
            const item = convertToPlaylist(res.items[0]);

            return Ok(item);
        } catch (error) {
            return Err(this.handleError(error));
        }
    }

    async addPlaylist(
        title: string,
        status: "public" | "private" | "unlisted",
        accessToken: string,
    ): Promise<Result<Playlist, YoutubeAdapterError>> {
        try {
            const res = await this.client.addPlaylist(
                title,
                status,
                accessToken,
            );
            const playlist = convertToPlaylist(res);
            return Ok(playlist);
        } catch (error) {
            return Err(this.handleError(error));
        }
    }

    async updatePlaylistItemPosition(
        itemId: string,
        playlistId: string,
        resourceId: string,
        position: number,
        accessToken: string,
    ): Promise<Result<PlaylistItem, YoutubeAdapterError>> {
        try {
            const res = await this.client.updatePlaylistItem(
                itemId,
                playlistId,
                resourceId,
                position,
                accessToken,
            );
            const playlistItem = convertToPlaylistItem(res);
            if (!playlistItem) throw makeError("UNKNOWN_ERROR"); // item will never be a private video.
            return Ok(playlistItem);
        } catch (error) {
            return Err(this.handleError(error));
        }
    }

    async deletePlaylist(
        playlistId: string,
        accessToken: string,
    ): Promise<Result<Playlist, YoutubeAdapterError>> {
        try {
            const playlist = await this.getPlaylist(playlistId, accessToken);

            if (playlist.isFailure()) throw playlist.data;
            const res = await this.client.deletePlaylist(
                playlist.data.getId,
                accessToken,
            );
            if (res === 204) return Ok(playlist.data);
            throw makeError("UNKNOWN_ERROR");
        } catch (error) {
            return Err(this.handleError(error));
        }
    }

    async addPlaylistItem(
        playlistId: string,
        resourceId: string,
        accessToken: string,
    ): Promise<Result<PlaylistItem, YoutubeAdapterError>> {
        try {
            const res = await this.client.addPlaylistItem(
                playlistId,
                resourceId,
                accessToken,
            );
            const item = convertToPlaylistItem(res);
            if (!item) throw makeError("UNKNOWN_ERROR"); // item will never be a private video.
            return Ok(item);
        } catch (error) {
            return Err(this.handleError(error));
        }
    }

    private handleError(err: unknown): YoutubeAdapterError {
        if (err instanceof YoutubeAdapterError) return err;

        if ((err as GaxiosError).response) {
            const e = err as GaxiosError;
            const names = Object.keys(
                ErrorCodes,
            ) as (keyof typeof ErrorCodes)[];

            for (const name of names) {
                if (e.status === ErrorCodes[name].code) {
                    return makeError(name);
                }
            }
        }

        return makeError("UNKNOWN_ERROR");
    }
}
