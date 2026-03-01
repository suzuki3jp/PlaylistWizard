"use server";
import type { AccId, PlaylistId } from "@/entities/ids";
import type { FullPlaylist } from "@/features/playlist/entities";
import { getAccessToken } from "@/lib/user";
import {
  createProviderRepository,
  type ProviderRepositoryType,
} from "@/repository/providers/factory";
import { fail, ok, type Result } from "@/usecase/actions/plain-result";

/**
 * アイテムを含む完全なプレイリストを取得する
 * @param param0
 * @returns
 */
export const getFullPlaylist = async ({
  id,
  repository,
  accId,
}: GetFullPlaylistOptions): Promise<Result<FullPlaylist>> => {
  const token = await getAccessToken(accId);
  if (!token) return fail(401);

  const adapter = createProviderRepository(repository);
  const fullPlaylist = await adapter.getFullPlaylist(id, token);
  if (fullPlaylist.isErr()) return fail(fullPlaylist.error.code);

  return ok(fullPlaylist.value);
};

interface GetFullPlaylistOptions {
  id: PlaylistId;
  repository: ProviderRepositoryType;
  accId: AccId;
}
