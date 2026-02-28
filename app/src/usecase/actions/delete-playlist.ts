"use server";
import type { Playlist } from "@/features/playlist/entities";
import { getAccessToken } from "@/lib/user";
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
  repository,
  accId,
}: DeletePlaylistOptions): Promise<Result<Playlist>> => {
  const token = await getAccessToken(accId);
  if (!token) return fail(401);

  const adapter = createProviderRepository(repository);
  const deletedPlaylist = await adapter.deletePlaylist(id, token);
  if (deletedPlaylist.isErr()) return fail(deletedPlaylist.error.code);

  return ok(deletedPlaylist.value);
};

interface DeletePlaylistOptions {
  id: string;
  repository: ProviderRepositoryType;
  accId: string;
}
