"use server";
import type { PrimitiveFullPlaylistInterface } from "@/entity";
import {
  type ProviderRepositoryType,
  createProviderRepository,
} from "@/repository/providers/factory";
import { type Result, fail, ok } from "@/usecase/actions/plain-result";

/**
 * アイテムを含む完全なプレイリストを取得する
 * @param param0
 * @returns
 */
export const getFullPlaylist = async ({
  id,
  token,
  repository,
}: GetFullPlaylistOptions): Promise<Result<PrimitiveFullPlaylistInterface>> => {
  const adapter = createProviderRepository(repository);
  const fullPlaylist = await adapter.getFullPlaylist(id, token);
  if (fullPlaylist.isErr()) return fail(fullPlaylist.error.code);

  return ok(fullPlaylist.value.toJSON());
};

interface GetFullPlaylistOptions {
  id: string;
  token: string;
  repository: ProviderRepositoryType;
}
