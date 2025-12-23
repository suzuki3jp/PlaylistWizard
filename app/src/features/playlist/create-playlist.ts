import { err, ok, type Result } from "neverthrow";
import { callWithRetries } from "@/common/call-with-retries";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { addPlaylist } from "@/usecase/actions/add-playlist";
import {
  type Failure,
  isOk,
  type Result as PlainResult,
} from "@/usecase/actions/plain-result";
import { type Playlist, PlaylistPrivacy } from "./entities";

export async function createPlaylist({
  title,
  privacy = PlaylistPrivacy.Private,
  accessToken,
  repository,
}: CreatePlaylistOptions): Promise<Result<Playlist, Failure>> {
  return plainResultToResult(
    await callWithRetries(
      { func: addPlaylist },
      {
        title,
        privacy,
        token: accessToken,
        repository,
      },
    ),
  );
}

function plainResultToResult<T>(result: PlainResult<T>): Result<T, Failure> {
  return isOk(result) ? ok(result.data) : err(result);
}

type CreatePlaylistOptions = {
  title: string;
  privacy?: PlaylistPrivacy;
  accessToken: string;
  repository: ProviderRepositoryType;
};
