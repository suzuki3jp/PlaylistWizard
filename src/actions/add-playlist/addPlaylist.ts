"use server";
import { type Result, fail, ok } from "@/actions/result";
import { type Playlist, convertToPlaylistFromClass } from "@/actions/typings";
import {
    type AdapterPlaylistPrivacy,
    type AdapterType,
    createAdapter,
} from "@/adapters";

/**
 * 新しいプレイリストを追加
 * @param param0
 * @returns
 */
export const addPlaylist = async ({
    title,
    privacy = "unlisted",
    token,
    adapterType,
}: AddPlaylistOptions): Promise<Result<Playlist>> => {
    const adapter = createAdapter(adapterType);
    const playlist = await adapter.addPlaylist(title, privacy, token);
    if (playlist.isErr()) return fail(playlist.data.code);

    const playlistData = convertToPlaylistFromClass(playlist.data);
    return ok(playlistData);
};

interface AddPlaylistOptions {
    title: string;
    privacy?: AdapterPlaylistPrivacy;
    token: string;
    adapterType: AdapterType;
}
