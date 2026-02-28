"use server";

import { getAccessToken } from "@/lib/user";
import {
  createProviderRepository,
  type ProviderRepositoryType,
} from "@/repository/providers/factory";
import { fail, ok, type Result } from "./plain-result";

export const removePlaylistItem = async ({
  playlistId,
  itemId,
  repository,
  accId,
}: RemovePlaylistItemOptions): Promise<Result<void>> => {
  const token = await getAccessToken(accId);
  if (!token) return fail(401);

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
  repository: ProviderRepositoryType;
  accId: string;
}
