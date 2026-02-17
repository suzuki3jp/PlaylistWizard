import { callWithRetries } from "@/common/call-with-retries";
import type { PlaylistPrivacy } from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { deletePlaylist } from "@/usecase/actions/delete-playlist";
import type { JobInterface } from "./index";

export class CreatePlaylistJob implements JobInterface {
  constructor(private readonly options: CreatePlaylistJobOptions) {}

  async undo() {
    const { provider, id } = this.options;
    return await callWithRetries(
      {
        func: deletePlaylist,
      },
      {
        id,
        repository: provider,
      },
    );
  }
}

interface CreatePlaylistJobOptions {
  provider: ProviderRepositoryType;
  id: string;
  title: string;
  privacy: PlaylistPrivacy;
}
