"use server";
import { type Result, fail, ok } from "@/actions/plain-result";
import { type IAdapterPlaylistItem, createAdapter } from "@/adapters";
import type { AdapterType } from "@/helpers/providerToAdapterType";

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
}: UpdatePlaylistItemPositionOptions): Promise<
    Result<IAdapterPlaylistItem>
> => {
    const adapter = createAdapter(adapterType);
    const updateResult = await adapter.updatePlaylistItemPosition(
        itemId,
        playlistId,
        resourceId,
        newIndex,
        token,
    );
    if (updateResult.isErr()) return fail(updateResult.error.code);

    return ok(updateResult.value.toJSON());
};

interface UpdatePlaylistItemPositionOptions {
    itemId: string;
    playlistId: string;
    resourceId: string;
    newIndex: number;
    token: string;
    adapterType: AdapterType;
}
