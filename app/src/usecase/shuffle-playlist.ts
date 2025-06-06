import { type Result, err, ok } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import { Playlist } from "@/entity";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getFullPlaylist } from "./actions/get-full-playlist";
import type { Failure as FailureData } from "./actions/plain-result";
import { updatePlaylistItemPosition } from "./actions/update-playlist-item-position";
import type {
  OnUpdatedPlaylistItemPositionHandler,
  OnUpdatingPlaylistItemPositionHandler,
} from "./types";

export class ShufflePlaylistUsecase {
  constructor(private options: ShufflePlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<Playlist, FailureData>> {
    const {
      accessToken,
      repository,
      targetPlaylistId,
      ratio,
      onUpdatedPlaylistItemPosition,
      onUpdatingPlaylistItemPosition,
    } = this.options;

    if (!this.validateRatio(ratio)) throw new Error("Invalid ratio");

    // 対象の完全なプレイリストを取得
    const target = await callWithRetries(
      { func: getFullPlaylist },
      {
        id: targetPlaylistId,
        token: accessToken,
        repository,
      },
    );
    if (target.status !== 200) return err(target);
    const targetPlaylist = target.data;

    // ratio から何個のプレイリストアイテムを移動するかを算出
    const itemsLength = targetPlaylist.items.length;
    const itemMoveCount = Math.floor(itemsLength * ratio);
    const itemsMaxIndex = itemsLength - 1;

    // アイテムのポジションを変更
    for (let i = 0; i < itemMoveCount; i++) {
      const targetItemIndex = getRandomInt(0, itemsMaxIndex);
      const targetItemNewIndex = getRandomInt(0, itemsMaxIndex);
      const targetItem = targetPlaylist.items[targetItemIndex];
      if (!targetItem) throw new Error("Internal Error 01");
      onUpdatingPlaylistItemPosition?.(
        targetItem,
        targetItemIndex,
        targetItemNewIndex,
      );

      const updatedItem = await callWithRetries(
        { func: updatePlaylistItemPosition },
        {
          itemId: targetItem.id,
          playlistId: targetPlaylist.id,
          resourceId: targetItem.videoId,
          newIndex: targetItemNewIndex,
          token: accessToken,
          repository,
        },
      );
      if (updatedItem.status !== 200) return err(updatedItem);
      onUpdatedPlaylistItemPosition?.(
        updatedItem.data,
        targetItemIndex,
        targetItemNewIndex,
        i,
        itemMoveCount,
      );
    }

    return ok(new Playlist(targetPlaylist));
  }

  private validateRatio(ratio: number): boolean {
    return ratio >= 0 && ratio <= 1;
  }
}

export function getRandomInt(min: number, max: number): number {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);

  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

export interface ShufflePlaylistUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  targetPlaylistId: string;
  ratio: number;
  onUpdatedPlaylistItemPosition?: OnUpdatedPlaylistItemPositionHandler;
  onUpdatingPlaylistItemPosition?: OnUpdatingPlaylistItemPositionHandler;
}
