"use server";
import { type Result, fail, ok } from "@/actions/plain-result";
import { type AdapterPlaylistPrivacy, createAdapter } from "@/adapters";
import type { IAdapterPlaylist } from "@/adapters";
import type { AdapterType } from "@/helpers/providerToAdapterType";

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
}: AddPlaylistOptions): Promise<Result<IAdapterPlaylist>> => {
  const adapter = createAdapter(adapterType);
  const playlist = await adapter.addPlaylist(title, privacy, token);
  if (playlist.isErr()) return fail(playlist.error.code);

  return ok(playlist.value.toJSON());
};

interface AddPlaylistOptions {
  title: string;
  privacy?: AdapterPlaylistPrivacy;
  token: string;
  adapterType: AdapterType;
}
