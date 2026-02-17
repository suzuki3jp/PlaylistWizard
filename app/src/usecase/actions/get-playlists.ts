"use server";
import type { Playlist } from "@/features/playlist/entities";
import { getAccessToken } from "@/lib/user";
import {
  createProviderRepository,
  type ProviderRepositoryType,
} from "@/repository/providers/factory";
import { fail, ok, type Result } from "@/usecase/actions/plain-result";

/**
 * アイテムを含まないプレイリストを取得する
 * @param param0
 * @returns
 */
export const getPlaylists = async ({
  repository,
}: GetPlaylistsOptions): Promise<Result<Playlist[]>> => {
  const token = await getAccessToken(repository);
  if (!token) return fail(401);

  const adapter = createProviderRepository(repository);
  const playlists = await adapter.getMinePlaylists(token);
  if (playlists.isErr()) return fail(playlists.error.code);

  return ok(playlists.value);
};

interface GetPlaylistsOptions {
  repository: ProviderRepositoryType;
}
