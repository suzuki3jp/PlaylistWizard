"use server";
import type { PlaylistPrivacy, PrimitivePlaylistInterface } from "@/entity";
import {
  type ProviderRepositoryType,
  createProviderRepository,
} from "@/repository/providers/factory";
import { type Result, fail, ok } from "@/usecase/actions/plain-result";

/**
 * 新しいプレイリストを追加
 * @param param0
 * @returns
 */
export const addPlaylist = async ({
  title,
  privacy = "unlisted",
  token,
  repository,
}: AddPlaylistOptions): Promise<Result<PrimitivePlaylistInterface>> => {
  const adapter = createProviderRepository(repository);
  const playlist = await adapter.addPlaylist(title, privacy, token);
  if (playlist.isErr()) return fail(playlist.error.code);

  return ok(playlist.value.toJSON());
};

interface AddPlaylistOptions {
  title: string;
  privacy?: PlaylistPrivacy;
  token: string;
  repository: ProviderRepositoryType;
}
