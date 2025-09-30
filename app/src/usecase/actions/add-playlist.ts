"use server";
import type { Playlist, PlaylistPrivacy } from "@/features/playlist/entities";
import {
  createProviderRepository,
  type ProviderRepositoryType,
} from "@/repository/providers/factory";
import { fail, ok, type Result } from "@/usecase/actions/plain-result";

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
}: AddPlaylistOptions): Promise<Result<Playlist>> => {
  const adapter = createProviderRepository(repository);
  const playlist = await adapter.addPlaylist(title, privacy, token);
  if (playlist.isErr()) return fail(playlist.error.code);

  return ok(playlist.value);
};

interface AddPlaylistOptions {
  title: string;
  privacy?: PlaylistPrivacy;
  token: string;
  repository: ProviderRepositoryType;
}
