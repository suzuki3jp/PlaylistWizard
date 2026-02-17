"use server";
import type { PlaylistItem } from "@/features/playlist/entities";
import { getAccessToken } from "@/lib/user";
import {
  createProviderRepository,
  type ProviderRepositoryType,
} from "@/repository/providers/factory";
import { fail, ok, type Result } from "@/usecase/actions/plain-result";

/**
 * プレイリストアイテムのポジションを変更する
 * @param param0
 * @returns
 */
export const updatePlaylistItemPosition = async ({
  itemId,
  playlistId,
  resourceId,
  newIndex,
  repository,
}: UpdatePlaylistItemPositionOptions): Promise<Result<PlaylistItem>> => {
  const token = await getAccessToken(repository);
  if (!token) return fail(401);

  const adapter = createProviderRepository(repository);
  const updateResult = await adapter.updatePlaylistItemPosition(
    itemId,
    playlistId,
    resourceId,
    newIndex,
    token,
  );
  if (updateResult.isErr()) return fail(updateResult.error.code);

  return ok(updateResult.value);
};

interface UpdatePlaylistItemPositionOptions {
  itemId: string;
  playlistId: string;
  resourceId: string;
  newIndex: number;
  repository: ProviderRepositoryType;
}
