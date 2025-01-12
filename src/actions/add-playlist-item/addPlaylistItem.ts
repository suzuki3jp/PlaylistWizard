"use server";
import { type Result, fail, ok } from "@/actions/result";
import {
    type PlaylistItem,
    convertToPlaylistItemFromClass,
} from "@/actions/typings";
import { YoutubeAdapter } from "@/lib/youtube-adapter";

/**
 * 既存のプレイリストにアイテムを追加する
 * @param param0
 * @returns
 */
export const addPlaylistItem = async ({
    playlistId,
    resourceId,
    token,
}: AddPlaylistItemOptions): Promise<Result<PlaylistItem>> => {
    const adapter = new YoutubeAdapter();
    const playlistItem = await adapter.addPlaylistItem(
        playlistId,
        resourceId,
        token,
    );
    if (playlistItem.isFailure()) return fail(playlistItem.data.code);

    const playlistItemData = convertToPlaylistItemFromClass(playlistItem.data);
    return ok(playlistItemData);
};

interface AddPlaylistItemOptions {
    playlistId: string;
    resourceId: string;
    token: string;
}
