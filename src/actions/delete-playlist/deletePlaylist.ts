"use server";
import { type Result, fail, ok } from "@/actions/result";
import { type Playlist, convertToPlaylistFromClass } from "@/actions/typings";
import { type AdapterType, createAdapter } from "@/adapters";

/**
 * プレイリストを削除する
 * @param param0
 * @returns
 */
export const deletePlaylist = async ({
    id,
    token,
    adapterType,
}: DeletePlaylistOptions): Promise<Result<Playlist>> => {
    const adapter = createAdapter(adapterType);
    const deletedPlaylist = await adapter.deletePlaylist(id, token);
    if (deletedPlaylist.isErr()) return fail(deletedPlaylist.data.code);

    const deletedPlaylistData = convertToPlaylistFromClass(
        deletedPlaylist.data,
    );
    return ok(deletedPlaylistData);
};

interface DeletePlaylistOptions {
    id: string;
    token: string;
    adapterType: AdapterType;
}
