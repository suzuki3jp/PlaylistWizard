"use server";
import { type Result, fail, ok } from "@/actions/plain-result";
import type { PrimitivePlaylistItemInterface } from "@/entity";
import {
  type ProviderRepositoryType,
  createProviderRepository,
} from "@/repository/providers/factory";

/**
 * 既存のプレイリストにアイテムを追加する
 * @param param0
 * @returns
 */
export const addPlaylistItem = async ({
  playlistId,
  resourceId,
  token,
  repository,
}: AddPlaylistItemOptions): Promise<Result<PrimitivePlaylistItemInterface>> => {
  const adapter = createProviderRepository(repository);
  const playlistItem = await adapter.addPlaylistItem(
    playlistId,
    resourceId,
    token,
  );
  if (playlistItem.isErr()) return fail(playlistItem.error.code);

  return ok(playlistItem.value.toJSON());
};

interface AddPlaylistItemOptions {
  playlistId: string;
  resourceId: string;
  token: string;
  repository: ProviderRepositoryType;
}
