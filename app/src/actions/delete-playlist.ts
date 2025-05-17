"use server";
import { type Result, fail, ok } from "@/actions/plain-result";
import { type IAdapterPlaylist, createAdapter } from "@/adapters";
import type { AdapterType } from "@/helpers/providerToAdapterType";

/**
 * プレイリストを削除する
 * @param param0
 * @returns
 */
export const deletePlaylist = async ({
  id,
  token,
  adapterType,
}: DeletePlaylistOptions): Promise<Result<IAdapterPlaylist>> => {
  const adapter = createAdapter(adapterType);
  const deletedPlaylist = await adapter.deletePlaylist(id, token);
  if (deletedPlaylist.isErr()) return fail(deletedPlaylist.error.code);

  return ok(deletedPlaylist.value.toJSON());
};

interface DeletePlaylistOptions {
  id: string;
  token: string;
  adapterType: AdapterType;
}
