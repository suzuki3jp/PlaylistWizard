import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import type { Playlist } from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getPlaylists } from "./actions/get-playlists";
import type { Failure } from "./actions/plain-result";

export class FetchMinePlaylistsUsecase {
  constructor(private options: FetchMinePlaylistsUsecaseOptions) {}

  public async execute(): Promise<Result<Playlist[], Failure>> {
    const { repository } = this.options;

    const playlists = await callWithRetries(
      { func: getPlaylists },
      {
        repository,
      },
    );

    return playlists.status === 200 ? ok(playlists.data) : err(playlists);
  }
}

export interface FetchMinePlaylistsUsecaseOptions {
  repository: ProviderRepositoryType;
}
