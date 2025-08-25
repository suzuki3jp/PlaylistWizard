"use server";

import {
  createProviderRepository,
  type ProviderRepositoryType,
} from "@/repository/providers/factory";
import { fail, ok, type Result } from "./plain-result";

export const removePlaylistItem = async ({
  playlistId,
  itemId,
  token,
  repository,
}: RemovePlaylistItemOptions): Promise<Result<void>> => {
  const provider = createProviderRepository(repository);
  const removedPlaylistItem = await provider.removePlaylistItem(
    itemId,
    playlistId,
    token,
  );
  if (removedPlaylistItem.isErr()) return fail(removedPlaylistItem.error.code);

  return ok(removedPlaylistItem.value);
};

interface RemovePlaylistItemOptions {
  playlistId: string;
  itemId: string;
  token: string;
  repository: ProviderRepositoryType;
}
