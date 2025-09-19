import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import { PlaylistItem, type PlaylistItemInterface } from "@/features/playlist";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { addPlaylistItem } from "./actions/add-playlist-item";
import type { Failure } from "./actions/plain-result";

export class AddPlaylistItemUsecase {
  constructor(private options: AddPlaylistItemUsecaseOptions) {}

  public async execute(): Promise<Result<PlaylistItemInterface, Failure>> {
    const { accessToken, repository, playlistId, resourceId } = this.options;

    const result = await callWithRetries(
      { func: addPlaylistItem },
      {
        playlistId,
        resourceId,
        token: accessToken,
        repository,
      },
    );
    return result.status === 200
      ? ok(new PlaylistItem(result.data))
      : err(result);
  }
}

export interface AddPlaylistItemUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  playlistId: string;
  resourceId: string;
}
