import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import {
  type FullPlaylist,
  PlaylistPrivacy,
} from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { addPlaylistItem } from "./actions/add-playlist-item";
import { getFullPlaylist } from "./actions/get-full-playlist";
import type { Failure as FailureData } from "./actions/plain-result";
import { FetchOrCreatePlaylistUsecase } from "./fetch-or-create-playlist";
import type {
  OnAddedPlaylistHandler,
  OnAddedPlaylistItemHandler,
  OnAddingPlaylistItemHandler,
} from "./types";
import { shouldAddItem } from "./utils";

export class CopyPlaylistUsecase {
  constructor(private options: CopyPlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylist, FailureData>> {
    const {
      accessToken,
      repository,
      sourcePlaylistId: sourceId,
      targetPlaylistId: targetId,
      privacy = PlaylistPrivacy.Private,
      allowDuplicate = false,
      onAddedPlaylist,
      onAddedPlaylistItem,
      onAddingPlaylistItem,
    } = this.options;

    // コピー対象の完全なプレイリストを取得
    const source = await callWithRetries(
      { func: getFullPlaylist },
      {
        id: sourceId,
        token: accessToken,
        repository,
      },
    );
    if (source.status !== 200) return err(source);
    const sourcePlaylist = source.data;

    const targetPlaylistResult = await new FetchOrCreatePlaylistUsecase({
      accessToken,
      repository,
      targetId,
      privacy,
      title: `${sourcePlaylist.title} - Copied`,
      onAddedPlaylist,
    }).execute();
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    // Add items to the target playlist.
    // If allowDuplicates is false, check if the item already exists in the target playlist.
    for (let index = 0; index < sourcePlaylist.items.length; index++) {
      const item = sourcePlaylist.items[index];

      if (!shouldAddItem(targetPlaylist, item, allowDuplicate)) {
        continue;
      }

      onAddingPlaylistItem?.(item);
      const addedItem = await callWithRetries(
        { func: addPlaylistItem },
        {
          playlistId: targetPlaylist.id,
          resourceId: item.videoId,
          token: accessToken,
          repository,
        },
      );
      if (addedItem.status !== 200) return err(addedItem);

      targetPlaylist.items.push(addedItem.data);
      onAddedPlaylistItem?.(
        addedItem.data,
        targetPlaylist,
        index,
        sourcePlaylist.items.length,
      );
    }

    return ok(targetPlaylist);
  }
}

export interface CopyPlaylistUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  sourcePlaylistId: string;
  targetPlaylistId?: string;
  privacy?: PlaylistPrivacy;
  allowDuplicate?: boolean;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
}
