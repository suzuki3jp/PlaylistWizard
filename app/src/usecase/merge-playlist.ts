import { callWithRetries } from "@/common/call-with-retries";
import type {
  FullPlaylistInterface,
  PlaylistPrivacy,
  PrimitiveFullPlaylistInterface,
  PrimitivePlaylistItemInterface,
} from "@/entity";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { type Result, err, ok } from "neverthrow";
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

export class MergePlaylistUsecase {
  constructor(private options: MergePlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<FullPlaylistInterface, FailureData>> {
    const {
      accessToken,
      repository,
      sourcePlaylistIds,
      targetPlaylistId,
      privacy = "private",
      allowDuplicate = false,
      onAddedPlaylist,
      onAddedPlaylistItem,
      onAddingPlaylistItem,
    } = this.options;

    // Get the full playlists of the source.
    const sourcePlaylists: PrimitiveFullPlaylistInterface[] = [];
    for (const id of sourcePlaylistIds) {
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
      title: sourcePlaylists.map((p) => p.title).join(" & "),
      onAddedPlaylist,
    }).execute();
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    // Add items to the target playlist.
    // If allowDuplicate is false, check if the item already exists in the target playlist.
    const queueItems: PrimitivePlaylistItemInterface[] =
      sourcePlaylists.flatMap((p) => p.items);
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

export interface MergePlaylistUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  sourcePlaylistIds: string[];
  targetPlaylistId?: string;
  privacy?: PlaylistPrivacy;
  allowDuplicate?: boolean;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
}
