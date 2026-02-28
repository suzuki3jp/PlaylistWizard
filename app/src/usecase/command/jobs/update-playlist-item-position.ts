import { callWithRetries } from "@/common/call-with-retries";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { updatePlaylistItemPosition } from "@/usecase/actions/update-playlist-item-position";
import type { JobInterface } from ".";

export class UpdatePlaylistItemPositionJob implements JobInterface {
  constructor(private readonly options: UpdatePlaylistItemPositionJobOptions) {}

  async undo() {
    const { provider, playlistId, itemId, resourceId, from, accId } =
      this.options;

    return await callWithRetries(
      {
        func: updatePlaylistItemPosition,
      },
      {
        playlistId,
        itemId,
        resourceId,
        newIndex: from,
        repository: provider,
        accId,
      },
    );
  }
}

export interface UpdatePlaylistItemPositionJobOptions {
  provider: ProviderRepositoryType;
  playlistId: string;
  itemId: string;
  resourceId: string;
  from: number;
  accId: string;
}
