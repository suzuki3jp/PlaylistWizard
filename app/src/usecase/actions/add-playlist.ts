"use server";
import { type Playlist, PlaylistPrivacy } from "@/features/playlist/entities";
import { getAccessToken } from "@/lib/user";
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
  privacy = PlaylistPrivacy.Unlisted,
  repository,
  accId,
}: AddPlaylistOptions): Promise<Result<Playlist>> => {
  const token = await getAccessToken(accId);
  if (!token) return fail(401);

  const adapter = createProviderRepository(repository);
  const playlist = await adapter.addPlaylist(title, privacy, token);
  if (playlist.isErr()) return fail(playlist.error.code);

  return ok(playlist.value);
};

interface AddPlaylistOptions {
  title: string;
  privacy?: PlaylistPrivacy;
  repository: ProviderRepositoryType;
  accId: string;
}
