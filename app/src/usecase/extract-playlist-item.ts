import { type Result, err, ok } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import type {
  PlaylistPrivacy,
  PrimitiveFullPlaylistInterface,
  PrimitivePlaylistItemInterface,
} from "@/entity";
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
import { shouldAddItem } from "./utils";

export class ExtractPlaylistItemUsecase {
  constructor(private options: ExtractPlaylistItemUsecaseOptions) {}

  public async execute(): Promise<
    Result<PrimitiveFullPlaylistInterface, Failure>
  > {
    const {
      accessToken,
      repository,
      targetPlaylistId,
      sourceIds,
      artistNames,
      allowDuplicate = false,
      privacy = "private",
      onAddedPlaylist,
      onAddedPlaylistItem,
      onAddingPlaylistItem,
    } = this.options;

    // Get the full playlists of the source.
    const sourcePlaylists: PrimitiveFullPlaylistInterface[] = [];
    for (const id of sourceIds) {
      const source = await callWithRetries(
        { func: getFullPlaylist },
        {
          id,
          token: accessToken,
          repository,
        },
      );
      if (source.status !== 200) return err(source);
      sourcePlaylists.push(source.data);
    }

    const targetPlaylistResult = await new FetchOrCreatePlaylistUsecase({
      accessToken,
      repository,
      targetId: targetPlaylistId,
      privacy,
      title: artistNames.join(" & "),
      onAddedPlaylist,
    }).execute();
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    const queueItems: PrimitivePlaylistItemInterface[] = sourcePlaylists
      .flatMap((p) => p.items)
      .filter((item) => artistNames.includes(item.author));
    for (let index = 0; index < queueItems.length; index++) {
      const item = queueItems[index];
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
        queueItems.length,
      );
    }
    return ok(targetPlaylist);
  }
}

export interface ExtractPlaylistItemUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  targetPlaylistId?: string;
  sourceIds: string[];
  artistNames: string[];
  allowDuplicate?: boolean;
  privacy?: PlaylistPrivacy;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
}
