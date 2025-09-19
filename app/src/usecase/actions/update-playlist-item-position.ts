"use server";
import type { PrimitivePlaylistItemInterface } from "@/features/playlist";
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
  token,
  repository,
}: UpdatePlaylistItemPositionOptions): Promise<
  Result<PrimitivePlaylistItemInterface>
> => {
  const adapter = createProviderRepository(repository);
  const updateResult = await adapter.updatePlaylistItemPosition(
    itemId,
    playlistId,
    resourceId,
    newIndex,
    token,
  );
  if (updateResult.isErr()) return fail(updateResult.error.code);

  return ok(updateResult.value.toJSON());
};

interface UpdatePlaylistItemPositionOptions {
  itemId: string;
  playlistId: string;
  resourceId: string;
  newIndex: number;
  token: string;
  repository: ProviderRepositoryType;
}
