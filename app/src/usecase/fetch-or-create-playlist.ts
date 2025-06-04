import { type Result, err, ok } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import {
  FullPlaylist,
  type FullPlaylistInterface,
  type PlaylistPrivacy,
  type PrimitiveFullPlaylistInterface,
} from "@/entity";
import type { ProviderRepositoryType } from "@/repository/providers/factory";

import { addPlaylist } from "./actions/add-playlist";
import { getFullPlaylist } from "./actions/get-full-playlist";
import type { Failure as FailureData } from "./actions/plain-result";
import type { OnAddedPlaylistHandler } from "./types";

export class FetchOrCreatePlaylistUsecase {
  constructor(private options: FetchOrCreatePlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylistInterface, FailureData>> {
    const {
      accessToken,
      repository,
      targetId,
      title,
      privacy = "private",
      onAddedPlaylist,
    } = this.options;

    // Fetch the playlist if targetId is provided
    const target = targetId
      ? await callWithRetries(
          { func: getFullPlaylist },
          {
            id: targetId,
            repository,
            token: accessToken,
          },
        )
      : null;
    if (target && target.status !== 200) return err(target);

    let targetPlaylist: PrimitiveFullPlaylistInterface;
    if (target) {
      targetPlaylist = target.data;
    } else {
      // Create a new playlist with the given title.
      const newPlaylist = await callWithRetries(
        { func: addPlaylist },
        {
          title,
          privacy,
          token: accessToken,
          repository,
        },
      );
      if (newPlaylist.status !== 200) return err(newPlaylist);
      targetPlaylist = { ...newPlaylist.data, items: [] };
      onAddedPlaylist?.(targetPlaylist);
    }

    return ok(new FullPlaylist(targetPlaylist));
  }
}

export interface FetchOrCreatePlaylistUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  title: string;
  targetId?: string;
  privacy?: PlaylistPrivacy;
  onAddedPlaylist?: OnAddedPlaylistHandler;
}
