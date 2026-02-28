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
import { filterItemsToAdd } from "./utils";

export class ImportPlaylistUsecase {
  constructor(private options: ImportPlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylist, FailureData>> {
    const {
      repository,
      sourcePlaylistId,
      privacy = PlaylistPrivacy.Private,
      allowDuplicate = false,
      onAddedPlaylist,
      onAddedPlaylistItem,
      onAddingPlaylistItem,
      accId,
    } = this.options;

    const source = await callWithRetries(
      { func: getFullPlaylist },
      {
        id: sourcePlaylistId,
        repository,
        accId,
      },
    );
    if (source.status !== 200) return err(source);
    const sourcePlaylist = source.data;

    const targetPlaylistResult = await new FetchOrCreatePlaylistUsecase({
      repository,
      title: `${sourcePlaylist.title} - Imported`,
      privacy,
      onAddedPlaylist,
      accId,
    }).execute();
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    const itemsToAdd = filterItemsToAdd(
      sourcePlaylist.items,
      targetPlaylist.items,
      allowDuplicate,
    );
    for (let index = 0; index < itemsToAdd.length; index++) {
      const item = itemsToAdd[index];

      onAddingPlaylistItem?.(item);
      const addedItem = await callWithRetries(
        { func: addPlaylistItem },
        {
          playlistId: targetPlaylist.id,
          resourceId: item.videoId,
          repository,
          accId,
        },
      );
      if (addedItem.status !== 200) return err(addedItem);
      targetPlaylist.items.push(addedItem.data);
      onAddedPlaylistItem?.(
        addedItem.data,
        targetPlaylist,
        index,
        itemsToAdd.length,
      );
    }
    return ok(targetPlaylist);
  }
}

export type ImportPlaylistUsecaseOptions = {
  repository: ProviderRepositoryType;
  sourcePlaylistId: string;
  privacy?: PlaylistPrivacy;
  allowDuplicate?: boolean;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
  accId: string;
};
