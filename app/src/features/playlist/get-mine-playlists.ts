import { callWithRetries } from "@/common/call-with-retries";
import type { AccId } from "@/entities/ids";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getPlaylists } from "@/usecase/actions/get-playlists";
import type { Result } from "@/usecase/actions/plain-result";
import type { Playlist } from "./entities";

export async function getMinePlaylists(
  repository: ProviderRepositoryType,
  accId: AccId,
): Promise<Result<Playlist[]>> {
  return await callWithRetries(
    { func: getPlaylists },
    {
      repository,
      accId,
    },
  );
}
