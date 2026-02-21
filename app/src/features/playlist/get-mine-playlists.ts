import { callWithRetries } from "@/common/call-with-retries";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getPlaylists } from "@/usecase/actions/get-playlists";
import type { Result } from "@/usecase/actions/plain-result";
import type { Playlist } from "./entities";

export async function getMinePlaylists(
  repository: ProviderRepositoryType,
): Promise<Result<Playlist[]>> {
  return await callWithRetries(
    { func: getPlaylists },
    {
      repository,
    },
  );
}
