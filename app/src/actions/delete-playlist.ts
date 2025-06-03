"use server";
import { type Result, fail, ok } from "@/actions/plain-result";
import type { PrimitivePlaylistInterface } from "@/entity";
import {
  type ProviderRepositoryType,
  createProviderRepository,
} from "@/repository/providers/factory";

/**
 * プレイリストを削除する
 * @param param0
 * @returns
 */
export const deletePlaylist = async ({
  id,
  token,
  repository,
}: DeletePlaylistOptions): Promise<Result<PrimitivePlaylistInterface>> => {
  const adapter = createProviderRepository(repository);
  const deletedPlaylist = await adapter.deletePlaylist(id, token);
  if (deletedPlaylist.isErr()) return fail(deletedPlaylist.error.code);

  return ok(deletedPlaylist.value.toJSON());
};

interface DeletePlaylistOptions {
  id: string;
  token: string;
  repository: ProviderRepositoryType;
}
