"use server";
import { type Result, fail, ok } from "@/actions/plain-result";
import { type IAdapterPlaylist, createAdapter } from "@/adapters";
import type { AdapterType } from "@/helpers/providerToAdapterType";

/**
 * アイテムを含まないプレイリストを取得する
 * @param param0
 * @returns
 */
export const getPlaylists = async ({
  token,
  adapterType,
}: GetPlaylistsOptions): Promise<Result<IAdapterPlaylist[]>> => {
  const adapter = createAdapter(adapterType);
  const playlists = await adapter.getPlaylists(token);
  if (playlists.isErr()) return fail(playlists.error.code);

  return ok(playlists.value.map((playlist) => playlist.toJSON()));
};

interface GetPlaylistsOptions {
  token: string;
  adapterType: AdapterType;
}
