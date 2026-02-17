import { callWithRetries } from "@/common/call-with-retries";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { addPlaylistItem } from "@/usecase/actions/add-playlist-item";
import type { JobInterface } from ".";

export class RemovePlaylistItemJob implements JobInterface {
  constructor(private readonly options: RemovePlaylistItemJobOptions) {}

  /**
   * For undoing the removal of a playlist, the playlist id is accepted as an optional parameter.
   */
  async undo({
    playlistId = this.options.playlistId,
  }: {
    playlistId?: string;
  } = {}) {
    const { provider, resourceId } = this.options;
    return await callWithRetries(
      { func: addPlaylistItem },
      {
        playlistId,
        resourceId,
        repository: provider,
      },
    );
  }
}

export interface RemovePlaylistItemJobOptions {
  provider: ProviderRepositoryType;
  playlistId: string;
  resourceId: string;
}
