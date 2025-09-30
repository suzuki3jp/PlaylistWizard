"use server";
import type { Playlist } from "@/features/playlist/entities";
import {
  createProviderRepository,
  type ProviderRepositoryType,
} from "@/repository/providers/factory";
import { fail, ok, type Result } from "@/usecase/actions/plain-result";

/**
 * プレイリストを削除する
 * @param param0
 * @returns
 */
export const deletePlaylist = async ({
  id,
  token,
  repository,
}: DeletePlaylistOptions): Promise<Result<Playlist>> => {
  const adapter = createProviderRepository(repository);
  const deletedPlaylist = await adapter.deletePlaylist(id, token);
  if (deletedPlaylist.isErr()) return fail(deletedPlaylist.error.code);

  return ok(deletedPlaylist.value);
};
    
interface DeletePlaylistOptions {
  id: string;
  token: string;
  repository: ProviderRepositoryType;
}
