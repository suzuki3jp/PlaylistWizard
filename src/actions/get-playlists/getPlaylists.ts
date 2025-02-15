"use server";
import { type Result, fail, ok } from "@/actions/result";
import { type Playlist, convertToPlaylistFromClass } from "@/actions/typings";
import { type AdapterType, createAdapter } from "@/adapters";

/**
 * アイテムを含まないプレイリストを取得する
 * @param param0
 * @returns
 */
export const getPlaylists = async ({
    token,
    adapterType,
}: GetPlaylistsOptions): Promise<Result<Playlist[]>> => {
    const adapter = createAdapter(adapterType);
    const playlists = await adapter.getPlaylists(token);
    if (playlists.isErr()) return fail(playlists.data.code);

    const playlistsData = playlists.data.map((p) =>
        convertToPlaylistFromClass(p),
    );
    return ok(playlistsData);
};

interface GetPlaylistsOptions {
    token: string;
    adapterType: AdapterType;
}
