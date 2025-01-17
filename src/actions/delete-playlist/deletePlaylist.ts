"use server";
import { type Result, fail, ok } from "@/actions/result";
import { type Playlist, convertToPlaylistFromClass } from "@/actions/typings";
import { YoutubeAdapter } from "@/lib/youtube-adapter";

/**
 * プレイリストを削除する
 * @param param0
 * @returns
 */
export const deletePlaylist = async ({
    id,
    token,
}: DeletePlaylistOptions): Promise<Result<Playlist>> => {
    const adapter = new YoutubeAdapter();
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
}
