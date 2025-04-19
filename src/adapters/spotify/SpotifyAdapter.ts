import { Err, Ok, type Result } from "result4js";
import { Client, type Playlist } from "spotify-api.js";

import { BaseAdapter, BaseAdapterError } from "@/adapters/BaseAdapter";
import {
    AdapterFullPlaylist,
    AdapterPlaylist,
    AdapterPlaylistItem,
} from "@/adapters/entities";

export class SpotifyAdapter extends BaseAdapter {
    async getPlaylists(
        accessToken: string,
    ): Promise<Result<AdapterPlaylist[], SpotifyAdapterError>> {
        return new Promise((resolve) => {
            try {
                new Client({
                    token: accessToken,
                    userAuthorizedToken: true,
                    onReady: async (client) => {
                        const MAX_LIMIT = 50;
                        const playlists = await client.user.getPlaylists({
                            limit: MAX_LIMIT,
                        });
                        const adapterPlaylists: AdapterPlaylist[] =
                            playlists.map((playlist) =>
                                convertToPlaylist(playlist),
                            );
                        resolve(Ok(adapterPlaylists));
                    },
                });
            } catch (error) {
                return Err(this.handleError(error));
            }
        });
    }

    private handleError(error: unknown): SpotifyAdapterError {
        if (error instanceof SpotifyAdapterError) return error;

        return makeError("UNKNOWN_ERROR");
    }

    private makeClient(token: string) {
        return new Client({
            token,
            userAuthorizedToken: true,
        });
    }
}

class SpotifyAdapterError extends BaseAdapterError {
    constructor(
        message: ErrorMessage,
        public readonly code: ErrorCode,
        public readonly status: ErrorStatus,
    ) {
        super(message, code, status);
        this.name = "SpotifyAdapterError";
    }
}

/**
 * Make a SpotifyAdapterError instance from the given error status.
 * @param name
 * @returns
 */
function makeError(name: ErrorStatus) {
    return new SpotifyAdapterError(
        SpotifyAdapterErrorCode[name].message,
        SpotifyAdapterErrorCode[name].code,
        name,
    );
}

export const SpotifyAdapterErrorCode = {
    UNKNOWN_ERROR: {
        code: 0,
        message: "UnknownError: An unknown error occurred during the request.",
    },
} as const;

type ErrorCode =
    (typeof SpotifyAdapterErrorCode)[keyof typeof SpotifyAdapterErrorCode]["code"];

type ErrorMessage =
    (typeof SpotifyAdapterErrorCode)[keyof typeof SpotifyAdapterErrorCode]["message"];

type ErrorStatus = keyof typeof SpotifyAdapterErrorCode;

/**
 * =============================================
 * =============================================
 * Entity converters for Spotify API
 * =============================================
 * =============================================
 */

/**
 * Convert a Spotify playlist to an AdapterPlaylist.
 * @param playlist
 * @returns
 */
export function convertToPlaylist(playlist: Playlist): AdapterPlaylist {
    const thumbnailUrl = playlist.images[0]?.url;
    if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");
    const obj = new AdapterPlaylist({
        id: playlist.id,
        title: playlist.name,
        thumbnailUrl,
        itemsTotal: playlist.totalTracks,
    });
    return obj;
}
