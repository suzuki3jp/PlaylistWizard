import type { WithCredentials } from "@/@types";
import { callWithRetries } from "@/common/call-with-retries";
import { addPlaylist } from "@/usecase/actions/add-playlist";
import type { JobInterface } from ".";

export class RemovePlaylistJob implements JobInterface {
  constructor(private readonly options: RemovePlaylistJobOptions) {}

  async undo() {
    const { accessToken, provider, title } = this.options;
    const playlist = await callWithRetries(
      { func: addPlaylist },
      { title, token: accessToken, repository: provider },
    );
    if (playlist.status !== 200) return playlist;

    for (const job of this.options.jobs) {
      await job.undo({ playlistId: playlist.data.id });
    }
    return playlist;
  }
}

export interface RemovePlaylistJobOptions extends WithCredentials {
  title: string;
  jobs: JobInterface[];
}
