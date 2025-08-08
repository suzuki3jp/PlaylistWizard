import { callWithRetries } from "@/common/call-with-retries";
import type { WithCredentials } from "@/lib/types/credentials";
import { updatePlaylistItemPosition } from "@/usecase/actions/update-playlist-item-position";
import type { JobInterface } from ".";

export class UpdatePlaylistItemPositionJob implements JobInterface {
  constructor(private readonly options: UpdatePlaylistItemPositionJobOptions) {}

  async undo() {
    const { accessToken, provider, playlistId, itemId, resourceId, from } =
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
        token: accessToken,
        repository: provider,
      },
    );
  }
}

export interface UpdatePlaylistItemPositionJobOptions extends WithCredentials {
  playlistId: string;
  itemId: string;
  resourceId: string;
  from: number;
}
