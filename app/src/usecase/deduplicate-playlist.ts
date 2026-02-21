import { err, ok, type Result } from "neverthrow";

import { callWithRetries } from "@/common/call-with-retries";
import type { PlaylistItem } from "@/features/playlist/entities";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getFullPlaylist } from "./actions/get-full-playlist";
import type { Failure as FailureData } from "./actions/plain-result";
import { removePlaylistItem } from "./actions/remove-playlist-item";
import type {
  OnRemovedPlaylistItemHandler,
  OnRemovingPlaylistItemHandler,
} from "./types";

export class DeduplicatePlaylistUsecase {
  constructor(private options: DeduplicatePlaylistUsecaseOptions) {}

  public async execute(): Promise<Result<PlaylistItem[], FailureData>> {
    const {
      repository,
      targetPlaylistId,
      onRemovingPlaylistItem,
      onRemovedPlaylistItem,
    } = this.options;

    // 対象の完全なプレイリストを取得
    const target = await callWithRetries(
      { func: getFullPlaylist },
      {
        id: targetPlaylistId,
        repository,
      },
    );
    if (target.status !== 200) return err(target);
    const targetPlaylist = target.data;

    // videoId で重複を検出
    const seen = new Map<string, PlaylistItem>();
    const duplicates: PlaylistItem[] = [];

    for (const item of targetPlaylist.items) {
      if (seen.has(item.videoId)) {
        duplicates.push(item);
      } else {
        seen.set(item.videoId, item);
      }
    }

    // 重複がない場合は空配列を返す
    if (duplicates.length === 0) return ok([]);

    // 重複アイテムを削除
    for (let i = 0; i < duplicates.length; i++) {
      const item = duplicates[i];
      if (!item) throw new Error("Internal Error 01");
      onRemovingPlaylistItem?.(item);

      const removed = await callWithRetries(
        { func: removePlaylistItem },
        {
          playlistId: targetPlaylist.id,
          itemId: item.id,
          repository,
        },
      );
      if (removed.status !== 200) return err(removed);
      onRemovedPlaylistItem?.(item, i, duplicates.length);
    }

    return ok(duplicates);
  }
}

export interface DeduplicatePlaylistUsecaseOptions {
  repository: ProviderRepositoryType;
  targetPlaylistId: string;
  onRemovingPlaylistItem?: OnRemovingPlaylistItemHandler;
  onRemovedPlaylistItem?: OnRemovedPlaylistItemHandler;
}
