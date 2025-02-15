"use server";
import { type Result, fail, ok } from "@/actions/result";
import {
    type PlaylistItem,
    convertToPlaylistItemFromClass,
} from "@/actions/typings";
import { type AdapterType, createAdapter } from "@/adapters";

/**
 * プレイリストアイテムのポジションを変更する
 * @param param0
 * @returns
 */
export const updatePlaylistItemPosition = async ({
    itemId,
    playlistId,
    resourceId,
    newIndex,
    token,
    adapterType,
}: UpdatePlaylistItemPositionOptions): Promise<Result<PlaylistItem>> => {
    const adapter = createAdapter(adapterType);
    const updateResult = await adapter.updatePlaylistItemPosition(
        itemId,
        playlistId,
        resourceId,
        newIndex,
        token,
    );
    if (updateResult.isErr()) return fail(updateResult.data.code);

    const playlistItemData = convertToPlaylistItemFromClass(updateResult.data);
    return ok(playlistItemData);
};

interface UpdatePlaylistItemPositionOptions {
    itemId: string;
    playlistId: string;
    resourceId: string;
    newIndex: number;
    token: string;
    adapterType: AdapterType;
}
