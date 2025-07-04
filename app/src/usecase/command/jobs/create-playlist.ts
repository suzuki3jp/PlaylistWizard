import type { WithCredentials } from "@/@types";
import { callWithRetries } from "@/common/call-with-retries";
import type { PlaylistPrivacy } from "@/entity";
import { addPlaylist } from "@/usecase/actions/add-playlist";
import { deletePlaylist } from "@/usecase/actions/delete-playlist";
import type { JobInterface } from "./index";

export class CreatePlaylistJob implements JobInterface {
  constructor(private readonly options: CreatePlaylistJobOptions) {}

  async undo() {
    const { accessToken, provider, id } = this.options;
    return await callWithRetries(
      {
        func: deletePlaylist,
      },
      {
        id,
        token: accessToken,
        repository: provider,
      },
    );
  }
}

interface CreatePlaylistJobOptions extends WithCredentials {
  id: string;
  title: string;
  privacy: PlaylistPrivacy;
}
