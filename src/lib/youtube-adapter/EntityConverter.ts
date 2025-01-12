import { Playlist, PlaylistItem } from "@/lib/base-adapter";
import type { youtube_v3 } from "googleapis";
import { makeError } from "./YoutubeAdapterError";

/**
 * Convert the given API response to a Playlist instance.
 * @param res
 * @returns
 */
export function convertToPlaylist(res: youtube_v3.Schema$Playlist): Playlist {
    if (
        !res.id ||
        !res.snippet ||
        !res.snippet.title ||
        !res.snippet.thumbnails ||
        typeof res.contentDetails?.itemCount !== "number"
    )
        throw makeError("UNKNOWN_ERROR");

    const thumbnailUrl = getThumbnailUrlFromAPIData(res.snippet.thumbnails);
    if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");

    const obj = new Playlist({
        id: res.id,
        title: res.snippet.title,
        thumbnailUrl,
        itemsTotal: res.contentDetails.itemCount,
    });
    return obj;
}

/**
 * Convert the given API response to a PlaylistItem instance.
 * If the owner of the video is a topic channel, it will be trimmed.
 * @param items
 * @returns
 */
export function convertToPlaylistItem(
    res: youtube_v3.Schema$PlaylistItem,
): PlaylistItem | null {
    if (res.status?.privacyStatus === "private") return null;

    if (
        !res.id ||
        !res.snippet ||
        !res.snippet.title ||
        !res.snippet.resourceId ||
        !res.snippet.resourceId.videoId ||
        typeof res.snippet.position !== "number" ||
        !res.snippet.videoOwnerChannelTitle ||
        !res.snippet.thumbnails
    )
        throw makeError("UNKNOWN_ERROR");

    const thumbnailUrl = getThumbnailUrlFromAPIData(res.snippet.thumbnails);
    if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");

    const obj = new PlaylistItem({
        id: res.id,
        title: res.snippet.title,
        thumbnailUrl,
        position: res.snippet.position,
        // Youtube Music の曲などのアイテムでは "OwnerName - Topic" という形式で返されるため " - Topic" をトリミングする
        author: res.snippet.videoOwnerChannelTitle
            .replace(/\s*-\s*Topic$/, "")
            .trim(),
        videoId: res.snippet.resourceId.videoId,
    });
    return obj;
}

/**
 * Get the thumbnail URL from the given API response data.
 * It will return the URL of the highest resolution thumbnail.
 * @param data
 * @returns
 */
export function getThumbnailUrlFromAPIData(
    data: youtube_v3.Schema$ThumbnailDetails,
): string | undefined {
    let url = data.default?.url;

    if (data.medium?.url) {
        url = data.medium?.url;
    }
    if (data.high?.url) {
        url = data.high?.url;
    }
    if (data.standard?.url) {
        url = data.standard?.url;
    }
    if (data.maxres?.url) {
        url = data.maxres?.url;
    }

    return url ?? undefined;
}
