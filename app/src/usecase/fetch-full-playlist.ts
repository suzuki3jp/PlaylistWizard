import { type Result, err, ok } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import { FullPlaylist, type FullPlaylistInterface } from "@/entity";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getFullPlaylist } from "./actions/get-full-playlist";
import type { Failure } from "./actions/plain-result";

export class FetchFullPlaylistUsecase {
  constructor(private options: FetchFullPlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylistInterface, Failure>> {
    const { accessToken, repository, playlistId } = this.options;

    const result = await callWithRetries(
      { func: getFullPlaylist },
      {
        id: playlistId,
        token: accessToken,
        repository,
      },
    );
    return result.status === 200
      ? ok(new FullPlaylist(result.data))
      : err(result);
  }
}

export interface FetchFullPlaylistUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  playlistId: string;
}
