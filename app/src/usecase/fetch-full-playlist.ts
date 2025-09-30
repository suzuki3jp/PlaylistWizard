import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import { FullPlaylist } from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getFullPlaylist } from "./actions/get-full-playlist";
import type { Failure } from "./actions/plain-result";

export class FetchFullPlaylistUsecase {
  constructor(private options: FetchFullPlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylist, Failure>> {
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
      ? ok(FullPlaylist.parse(result.data))
      : err(result);
  }
}

export interface FetchFullPlaylistUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  playlistId: string;
}
