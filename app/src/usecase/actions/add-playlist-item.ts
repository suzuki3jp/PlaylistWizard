"use server";
import type { PlaylistItem } from "@/features/playlist/entities";
import { getAccessToken } from "@/lib/user";
import {
  createProviderRepository,
  type ProviderRepositoryType,
} from "@/repository/providers/factory";
import { fail, ok, type Result } from "@/usecase/actions/plain-result";

/**
 * 既存のプレイリストにアイテムを追加する
 * @param param0
 * @returns
 */
export const addPlaylistItem = async ({
  playlistId,
  resourceId,
  repository,
}: AddPlaylistItemOptions): Promise<Result<PlaylistItem>> => {
  const token = await getAccessToken(repository);
  if (!token) return fail(401);

  const adapter = createProviderRepository(repository);
  const playlistItem = await adapter.addPlaylistItem(
    playlistId,
    resourceId,
    token,
  );
  if (playlistItem.isErr()) return fail(playlistItem.error.code);

  return ok(playlistItem.value);
};

interface AddPlaylistItemOptions {
  playlistId: string;
  resourceId: string;
  repository: ProviderRepositoryType;
}
