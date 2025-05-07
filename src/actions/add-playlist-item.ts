"use server";
import { type Result, fail, ok } from "@/actions/plain-result";
import { type IAdapterPlaylistItem, createAdapter } from "@/adapters";
import type { AdapterType } from "@/helpers/providerToAdapterType";

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
}: AddPlaylistItemOptions): Promise<Result<IAdapterPlaylistItem>> => {
    const adapter = createAdapter(adapterType);
    const playlistItem = await adapter.addPlaylistItem(
        playlistId,
        resourceId,
        token,
    );
    if (playlistItem.isErr()) return fail(playlistItem.error.code);

    return ok(playlistItem.value.toJSON());
};

interface AddPlaylistItemOptions {
    playlistId: string;
    resourceId: string;
    token: string;
    adapterType: AdapterType;
}
