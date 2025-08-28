import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import { Playlist } from "@/entity";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getPlaylists } from "./actions/get-playlists";
import type { Failure } from "./actions/plain-result";

export class FetchMinePlaylistsUsecase {
  constructor(private options: FetchMinePlaylistsUsecaseOptions) {}

  public async execute(): Promise<Result<Playlist[], Failure>> {
    const { accessToken, repository } = this.options;

    const playlists = await callWithRetries(
      { func: getPlaylists },
      {
        token: accessToken,
        repository,
      },
    );

    return playlists.status === 200
      ? ok(playlists.data.map((p) => new Playlist(p)))
      : err(playlists);
  }
}

export interface FetchMinePlaylistsUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
}
