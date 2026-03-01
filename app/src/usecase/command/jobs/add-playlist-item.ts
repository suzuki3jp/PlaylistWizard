import { callWithRetries } from "@/common/call-with-retries";
import type { AccId, PlaylistId, PlaylistItemId } from "@/entities/ids";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { removePlaylistItem } from "@/usecase/actions/remove-playlist-item";
import type { JobInterface } from ".";

export class AddPlaylistItemJob implements JobInterface {
  constructor(private readonly options: AddPlaylistItemJobOptions) {}

  async undo() {
    const { provider, playlistId, itemId, accId } = this.options;
    return await callWithRetries(
      {
        func: removePlaylistItem,
      },
      {
        playlistId,
        itemId,
        repository: provider,
        accId,
      },
    );
  }
}

interface AddPlaylistItemJobOptions {
  provider: ProviderRepositoryType;
  playlistId: PlaylistId;
  itemId: PlaylistItemId;
  accId: AccId;
}
