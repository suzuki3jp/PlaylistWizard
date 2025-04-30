"use server";
import { type Result, fail, ok } from "@/actions/plain-result";
import { type IAdapterFullPlaylist, createAdapter } from "@/adapters";
import type { AdapterType } from "@/helpers/providerToAdapterType";

/**
 * アイテムを含む完全なプレイリストを取得する
 * @param param0
 * @returns
 */
export const getFullPlaylist = async ({
    id,
    token,
    adapterType,
}: GetFullPlaylistOptions): Promise<Result<IAdapterFullPlaylist>> => {
    const adapter = createAdapter(adapterType);
    const fullPlaylist = await adapter.getFullPlaylist(id, token);
    if (fullPlaylist.isErr()) return fail(fullPlaylist.error.code);

    return ok(fullPlaylist.value.toJSON());
};

interface GetFullPlaylistOptions {
    id: string;
    token: string;
    adapterType: AdapterType;
}
