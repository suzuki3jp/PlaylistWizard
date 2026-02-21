"use server";
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
}: GetFullPlaylistOptions): Promise<Result<FullPlaylist>> => {
  const token = await getAccessToken(repository);
  if (!token) return fail(401);

  const adapter = createProviderRepository(repository);
  const fullPlaylist = await adapter.getFullPlaylist(id, token);
  if (fullPlaylist.isErr()) return fail(fullPlaylist.error.code);

  return ok(fullPlaylist.value);
};

interface GetFullPlaylistOptions {
  id: string;
  repository: ProviderRepositoryType;
}
