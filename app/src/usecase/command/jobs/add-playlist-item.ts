import type { WithCredentials } from "@/@types";
import { callWithRetries } from "@/common/call-with-retries";
import { addPlaylistItem } from "@/usecase/actions/add-playlist-item";
import { removePlaylistItem } from "@/usecase/actions/remove-playlist-item";
import type { JobInterface } from ".";

export class AddPlaylistItemJob implements JobInterface {
  constructor(private readonly options: AddPlaylistItemJobOptions) {}

  async redo() {
    const { accessToken, provider, playlistId, itemId } = this.options;

    return await callWithRetries(
      { func: addPlaylistItem },
      {
        playlistId,
        resourceId: itemId,
        token: accessToken,
        repository: provider,
      },
    );
  }

  async undo() {
    const { accessToken, provider, playlistId, itemId } = this.options;
    return await callWithRetries(
      {
        func: removePlaylistItem,
      },
      {
        playlistId,
        itemId,
        token: accessToken,
        repository: provider,
      },
    );
  }
}

interface AddPlaylistItemJobOptions extends WithCredentials {
  playlistId: string;
  itemId: string;
}
