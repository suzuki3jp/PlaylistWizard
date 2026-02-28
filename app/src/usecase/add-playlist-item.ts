import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import type { PlaylistItem } from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { addPlaylistItem } from "./actions/add-playlist-item";
import type { Failure } from "./actions/plain-result";

export class AddPlaylistItemUsecase {
  constructor(private options: AddPlaylistItemUsecaseOptions) {}

  public async execute(): Promise<Result<PlaylistItem, Failure>> {
    const { repository, playlistId, resourceId, accId } = this.options;

    const result = await callWithRetries(
      { func: addPlaylistItem },
      {
        playlistId,
        resourceId,
        repository,
        accId,
      },
    );
    return result.status === 200 ? ok(result.data) : err(result);
  }
}

export interface AddPlaylistItemUsecaseOptions {
  repository: ProviderRepositoryType;
  playlistId: string;
  resourceId: string;
  accId: string;
}
