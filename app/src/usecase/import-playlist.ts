import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import type {
  FullPlaylist,
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

export class ImportPlaylistUsecase {
  constructor(private options: ImportPlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylist, FailureData>> {
    const {
      accessToken,
      repository,
      sourcePlaylistId,
      privacy = "private",
      allowDuplicate = false,
      onAddedPlaylist,
      onAddedPlaylistItem,
      onAddingPlaylistItem,
    } = this.options;

    const source = await callWithRetries(
      { func: getFullPlaylist },
      {
        id: sourcePlaylistId,
        token: accessToken,
        repository,
      },
    );
    if (source.status !== 200) return err(source);
    const sourcePlaylist = source.data;

    const targetPlaylistResult = await new FetchOrCreatePlaylistUsecase({
      accessToken,
      repository,
      title: `${sourcePlaylist.title} - Imported`,
      privacy,
      onAddedPlaylist,
    }).execute();
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    for (const item of sourcePlaylist.items) {
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
        targetPlaylist.items.length,
        sourcePlaylist.items.length,
      );
    }
    return ok(targetPlaylist);
  }
}

export type ImportPlaylistUsecaseOptions = {
  accessToken: string;
  repository: ProviderRepositoryType;
  sourcePlaylistId: string;
  privacy?: PlaylistPrivacy;
  allowDuplicate?: boolean;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
};
