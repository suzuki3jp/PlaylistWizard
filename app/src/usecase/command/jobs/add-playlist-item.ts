import { callWithRetries } from "@/common/call-with-retries";
import type { WithCredentials } from "@/lib/types/credentials";
import { addPlaylistItem } from "@/usecase/actions/add-playlist-item";
import { removePlaylistItem } from "@/usecase/actions/remove-playlist-item";
import type { JobInterface } from ".";

export class AddPlaylistItemJob implements JobInterface {
  constructor(private readonly options: AddPlaylistItemJobOptions) {}

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
