import { callWithRetries } from "@/common/call-with-retries";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { removePlaylistItem } from "@/usecase/actions/remove-playlist-item";
import type { JobInterface } from ".";

export class AddPlaylistItemJob implements JobInterface {
  constructor(private readonly options: AddPlaylistItemJobOptions) {}

  async undo() {
    const { provider, playlistId, itemId } = this.options;
    return await callWithRetries(
      {
        func: removePlaylistItem,
      },
      {
        playlistId,
        itemId,
        repository: provider,
      },
    );
  }
}

interface AddPlaylistItemJobOptions {
  provider: ProviderRepositoryType;
  playlistId: string;
  itemId: string;
}
