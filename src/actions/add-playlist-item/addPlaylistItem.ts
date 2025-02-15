"use server";
import { type Result, fail, ok } from "@/actions/result";
import {
    type PlaylistItem,
    convertToPlaylistItemFromClass,
} from "@/actions/typings";
import { type AdapterType, createAdapter } from "@/adapters";

/**
 * 既存のプレイリストにアイテムを追加する
 * @param param0
 * @returns
 */
export const addPlaylistItem = async ({
    playlistId,
    resourceId,
    token,
    adapterType,
}: AddPlaylistItemOptions): Promise<Result<PlaylistItem>> => {
    const adapter = createAdapter(adapterType);
    const playlistItem = await adapter.addPlaylistItem(
        playlistId,
        resourceId,
        token,
    );
    if (playlistItem.isErr()) return fail(playlistItem.data.code);

    const playlistItemData = convertToPlaylistItemFromClass(playlistItem.data);
    return ok(playlistItemData);
};

interface AddPlaylistItemOptions {
    playlistId: string;
    resourceId: string;
    token: string;
    adapterType: AdapterType;
}
