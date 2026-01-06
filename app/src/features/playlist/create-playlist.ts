import type { Result } from "neverthrow";
import { callWithRetries } from "@/common/call-with-retries";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { addPlaylist } from "@/usecase/actions/add-playlist";
import {
  type Failure,
  plainResultToResult,
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

type CreatePlaylistOptions = {
  title: string;
  privacy?: PlaylistPrivacy;
  accessToken: string;
  repository: ProviderRepositoryType;
};
