import { type Result, err, ok } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import { Playlist, type PrimitivePlaylistInterface } from "@/entity";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { deletePlaylist } from "./actions/delete-playlist";
import type { Failure } from "./actions/plain-result";

export class DeletePlaylistUsecase {
  constructor(private options: DeletePlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<PrimitivePlaylistInterface, Failure>> {
    const { accessToken, repository, playlistId } = this.options;

    const result = await callWithRetries(
      { func: deletePlaylist },
      {
        id: playlistId,
        token: accessToken,
        repository,
      },
    );
    return result.status === 200 ? ok(new Playlist(result.data)) : err(result);
  }
}

export interface DeletePlaylistUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  playlistId: string;
}
