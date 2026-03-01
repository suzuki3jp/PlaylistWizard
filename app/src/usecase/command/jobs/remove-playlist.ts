import { callWithRetries } from "@/common/call-with-retries";
import type { AccId } from "@/entities/ids";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { addPlaylist } from "@/usecase/actions/add-playlist";
import type { JobInterface } from ".";

export class RemovePlaylistJob implements JobInterface {
  constructor(private readonly options: RemovePlaylistJobOptions) {}

  async undo() {
    const { provider, title, accId } = this.options;
    const playlist = await callWithRetries(
      { func: addPlaylist },
      { title, repository: provider, accId },
    );
    if (playlist.status !== 200) return playlist;

    for (const job of this.options.jobs) {
      await job.undo({ playlistId: playlist.data.id });
    }
    return playlist;
  }
}

export interface RemovePlaylistJobOptions {
  provider: ProviderRepositoryType;
  title: string;
  jobs: JobInterface[];
  accId: AccId;
}
