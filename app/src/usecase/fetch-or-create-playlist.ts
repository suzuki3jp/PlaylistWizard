import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import {
  type FullPlaylist,
  PlaylistPrivacy,
} from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";

import { addPlaylist } from "./actions/add-playlist";
import { getFullPlaylist } from "./actions/get-full-playlist";
import type { Failure as FailureData } from "./actions/plain-result";
import type { OnAddedPlaylistHandler } from "./types";

export class FetchOrCreatePlaylistUsecase {
  constructor(private options: FetchOrCreatePlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylist, FailureData>> {
    const {
      repository,
      targetId,
      title,
      privacy = PlaylistPrivacy.Private,
      onAddedPlaylist,
      accId,
    } = this.options;

    // Fetch the playlist if targetId is provided
    const target = targetId
      ? await callWithRetries(
          { func: getFullPlaylist },
          {
            id: targetId,
            repository,
            accId,
          },
        )
      : null;
    if (target && target.status !== 200) return err(target);

    let targetPlaylist: FullPlaylist;
    if (target) {
      targetPlaylist = target.data;
    } else {
      // Create a new playlist with the given title.
      const newPlaylist = await callWithRetries(
        { func: addPlaylist },
        {
          title,
          privacy,
          repository,
          accId,
        },
      );
      if (newPlaylist.status !== 200) return err(newPlaylist);
      targetPlaylist = { ...newPlaylist.data, items: [] };
      onAddedPlaylist?.(targetPlaylist);
    }

    return ok(targetPlaylist);
  }
}

export interface FetchOrCreatePlaylistUsecaseOptions {
  repository: ProviderRepositoryType;
  title: string;
  targetId?: string;
  privacy?: PlaylistPrivacy;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  accId: string;
}
