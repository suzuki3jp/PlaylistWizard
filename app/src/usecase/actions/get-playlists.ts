"use server";
import type { PrimitivePlaylistInterface } from "@/entity";
import {
  type ProviderRepositoryType,
  createProviderRepository,
} from "@/repository/providers/factory";
import { type Result, fail, ok } from "@/usecase/actions/plain-result";

/**
 * アイテムを含まないプレイリストを取得する
 * @param param0
 * @returns
 */
export const getPlaylists = async ({
  token,
  repository,
}: GetPlaylistsOptions): Promise<Result<PrimitivePlaylistInterface[]>> => {
  const adapter = createProviderRepository(repository);
  const playlists = await adapter.getMinePlaylists(token);
  if (playlists.isErr()) return fail(playlists.error.code);

  return ok(playlists.value.map((playlist) => playlist.toJSON()));
};

interface GetPlaylistsOptions {
  token: string;
  repository: ProviderRepositoryType;
}
