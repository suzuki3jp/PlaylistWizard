"use server";
import { type Result, fail, ok } from "@/actions/result";
import {
    type FullPlaylist,
    convertToFullPlaylistFromClass,
} from "@/actions/typings";
import { type AdapterType, createAdapter } from "@/adapters";

/**
 * アイテムを含む完全なプレイリストを取得する
 * @param param0
 * @returns
 */
export const getFullPlaylist = async ({
    id,
    token,
    adapterType,
}: GetFullPlaylistOptions): Promise<Result<FullPlaylist>> => {
    const adapter = createAdapter(adapterType);
    const fullPlaylist = await adapter.getFullPlaylist(id, token);
    if (fullPlaylist.isErr()) return fail(fullPlaylist.data.code);

    const fullPlaylistData = convertToFullPlaylistFromClass(fullPlaylist.data);
    return ok(fullPlaylistData);
};

interface GetFullPlaylistOptions {
    id: string;
    token: string;
    adapterType: AdapterType;
}
