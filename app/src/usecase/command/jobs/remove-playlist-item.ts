import { callWithRetries } from "@/common/call-with-retries";
import type { WithCredentials } from "@/lib/types/credentials";
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
    const { accessToken, provider, resourceId } = this.options;
    return await callWithRetries(
      { func: addPlaylistItem },
      {
        playlistId,
        resourceId,
        token: accessToken,
        repository: provider,
      },
    );
  }
}

export interface RemovePlaylistItemJobOptions extends WithCredentials {
  playlistId: string;
  resourceId: string;
}
