import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import type { Playlist } from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { deletePlaylist } from "./actions/delete-playlist";
import type { Failure } from "./actions/plain-result";

export class DeletePlaylistUsecase {
  constructor(private options: DeletePlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<Playlist, Failure>> {
    const { accessToken, repository, playlistId } = this.options;

    const result = await callWithRetries(
      { func: deletePlaylist },
      {
        id: playlistId,
        token: accessToken,
        repository,
      },
    );
    return result.status === 200 ? ok(result.data) : err(result);
  }
}

export interface DeletePlaylistUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  playlistId: string;
}
