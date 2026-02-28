import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import {
  type FullPlaylist,
  type PlaylistItem,
  PlaylistPrivacy,
} from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { addPlaylistItem } from "./actions/add-playlist-item";
import { getFullPlaylist } from "./actions/get-full-playlist";
import type { Failure } from "./actions/plain-result";
import { FetchOrCreatePlaylistUsecase } from "./fetch-or-create-playlist";
import type {
  OnAddedPlaylistHandler,
  OnAddedPlaylistItemHandler,
  OnAddingPlaylistItemHandler,
} from "./types";
import { filterItemsToAdd } from "./utils";

export class ExtractPlaylistItemUsecase {
  constructor(private options: ExtractPlaylistItemUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylist, Failure>> {
    const {
      repository,
      targetPlaylistId,
      sourceIds,
      artistNames,
      allowDuplicate = false,
      privacy = PlaylistPrivacy.Private,
      onAddedPlaylist,
      onAddedPlaylistItem,
      onAddingPlaylistItem,
      accId,
    } = this.options;

    // Get the full playlists of the source.
    const sourcePlaylists: FullPlaylist[] = [];
    for (const id of sourceIds) {
      const source = await callWithRetries(
        { func: getFullPlaylist },
        {
          id,
          repository,
          accId,
        },
      );
      if (source.status !== 200) return err(source);
      sourcePlaylists.push(source.data);
    }

    const targetPlaylistResult = await new FetchOrCreatePlaylistUsecase({
      repository,
      targetId: targetPlaylistId,
      privacy,
      title: artistNames.join(" & "),
      onAddedPlaylist,
      accId,
    }).execute();
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    const queueItems: PlaylistItem[] = sourcePlaylists
      .flatMap((p) => p.items)
      .filter((item) => artistNames.includes(item.author));
    const itemsToAdd = filterItemsToAdd(
      queueItems,
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

export interface ExtractPlaylistItemUsecaseOptions {
  repository: ProviderRepositoryType;
  targetPlaylistId?: string;
  sourceIds: string[];
  artistNames: string[];
  allowDuplicate?: boolean;
  privacy?: PlaylistPrivacy;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
  accId: string;
}
