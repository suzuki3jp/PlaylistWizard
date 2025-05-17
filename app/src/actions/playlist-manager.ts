import { type Result, err, ok } from "neverthrow";

import type { AdapterPlaylistPrivacy } from "@/adapters";
import type {
  IAdapterFullPlaylist,
  IAdapterPlaylist,
  IAdapterPlaylistItem,
} from "@/adapters";
import type { AdapterType } from "@/helpers/providerToAdapterType";
import { sleep } from "@/helpers/sleep";
import { addPlaylist } from "./add-playlist";
import { addPlaylistItem } from "./add-playlist-item";
import { deletePlaylist } from "./delete-playlist";
import { getFullPlaylist } from "./get-full-playlist";
import { getPlaylists } from "./get-playlists";
import type { Failure as FailureData } from "./plain-result";
import { updatePlaylistItemPosition } from "./update-playlist-item-position";

// TODO: 409 コンフリクトが起こったときはリクエストを再試行する
// TODO: failure の時操作のどのフェーズで失敗したかを含めることで、どこまでは操作が行われているかUIに表示する
export class PlaylistManager {
  constructor(
    private token: string,
    private adapter: AdapterType,
  ) {}

  public async copy({
    sourceId,
    targetId,
    allowDuplicates = false,
    privacy,
    onAddedPlaylist,
    onAddedPlaylistItem,
    onAddingPlaylistItem,
  }: CopyOptions): Promise<Result<IAdapterFullPlaylist, FailureData>> {
    // コピー対象の完全なプレイリストを取得
    const source = await this.callApiWithRetry(getFullPlaylist, {
      id: sourceId,
      token: this.token,
      adapterType: this.adapter,
    });
    if (source.status !== 200) return err(source);
    const sourcePlaylist = source.data;

    const targetPlaylistResult = await this.fetchOrCreatePlaylist({
      targetId,
      privacy,
      title: `${sourcePlaylist.title} - Copied`,
      onAddedPlaylist,
    });
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    // Add items to the target playlist.
    // If allowDuplicates is false, check if the item already exists in the target playlist.
    for (let index = 0; index < sourcePlaylist.items.length; index++) {
      const item = sourcePlaylist.items[index];

      if (!this.isShouldAddItem(targetPlaylist, item, allowDuplicates)) {
        continue;
      }

      onAddingPlaylistItem?.(item);
      const addedItem = await this.callApiWithRetry(addPlaylistItem, {
        playlistId: targetPlaylist.id,
        resourceId: item.videoId,
        token: this.token,
        adapterType: this.adapter,
      });
      if (addedItem.status !== 200) return err(addedItem);

      targetPlaylist.items.push(addedItem.data);
      onAddedPlaylistItem?.(addedItem.data, index, sourcePlaylist.items.length);
    }

    return ok(targetPlaylist);
  }

  public async merge({
    sourceIds,
    targetId,
    allowDuplicates = false,
    privacy,
    onAddedPlaylist,
    onAddedPlaylistItem,
    onAddingPlaylistItem,
  }: MergeOptions): Promise<Result<IAdapterFullPlaylist, FailureData>> {
    // Get the full playlists of the source.
    const sourcePlaylists: IAdapterFullPlaylist[] = [];
    for (const id of sourceIds) {
      const source = await this.callApiWithRetry(getFullPlaylist, {
        id,
        token: this.token,
        adapterType: this.adapter,
      });
      if (source.status !== 200) return err(source);
      sourcePlaylists.push(source.data);
    }

    const targetPlaylistResult = await this.fetchOrCreatePlaylist({
      targetId,
      privacy,
      title: sourcePlaylists.map((p) => p.title).join(" & "),
      onAddedPlaylist,
    });
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    // Add items to the target playlist.
    // If allowDuplicates is false, check if the item already exists in the target playlist.
    const queueItems: IAdapterPlaylistItem[] = sourcePlaylists.flatMap(
      (p) => p.items,
    );
    for (let index = 0; index < queueItems.length; index++) {
      const item = queueItems[index];
      if (!this.isShouldAddItem(targetPlaylist, item, allowDuplicates)) {
        continue;
      }

      onAddingPlaylistItem?.(item);
      const addedItem = await this.callApiWithRetry(addPlaylistItem, {
        playlistId: targetPlaylist.id,
        resourceId: item.videoId,
        token: this.token,
        adapterType: this.adapter,
      });
      if (addedItem.status !== 200) return err(addedItem);
      targetPlaylist.items.push(addedItem.data);
      onAddedPlaylistItem?.(addedItem.data, index, queueItems.length);
    }

    return ok(targetPlaylist);
  }

  public async shuffle({
    targetId,
    ratio,
    onUpdatedPlaylistItemPosition,
    onUpdatingPlaylistItemPosition,
  }: ShuffleOptions): Promise<Result<IAdapterPlaylist, FailureData>> {
    if (!this.validateRatio(ratio)) throw new Error("Invalid ratio");

    // 対象の完全なプレイリストを取得
    const target = await this.callApiWithRetry(getFullPlaylist, {
      id: targetId,
      token: this.token,
      adapterType: this.adapter,
    });
    if (target.status !== 200) return err(target);
    const targetPlaylist = target.data;

    // ratio から何個のプレイリストアイテムを移動するかを算出
    const itemsLength = targetPlaylist.items.length;
    const itemMoveCount = Math.floor(itemsLength * ratio);
    const itemsMaxIndex = itemsLength - 1;

    // アイテムのポジションを変更
    for (let i = 0; i < itemMoveCount; i++) {
      const targetItemIndex = this.getRandomInt(0, itemsMaxIndex);
      const targetItemNewIndex = this.getRandomInt(0, itemsMaxIndex);
      const targetItem = targetPlaylist.items[targetItemIndex];
      if (!targetItem) throw new Error("Internal Error 01");
      onUpdatingPlaylistItemPosition?.(
        targetItem,
        targetItemIndex,
        targetItemNewIndex,
      );

      const updatedItem = await this.callApiWithRetry(
        updatePlaylistItemPosition,
        {
          itemId: targetItem.id,
          playlistId: targetPlaylist.id,
          resourceId: targetItem.videoId,
          newIndex: targetItemNewIndex,
          token: this.token,
          adapterType: this.adapter,
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

    return ok(targetPlaylist);
  }

  public async extract({
    targetId,
    sourceIds,
    extractArtists,
    allowDuplicates = false,
    privacy,
    onAddedPlaylist,
    onAddedPlaylistItem,
    onAddingPlaylistItem,
  }: ExtractOptions) {
    // Get the full playlists of the source.
    const sourcePlaylists: IAdapterFullPlaylist[] = [];
    for (const id of sourceIds) {
      const source = await this.callApiWithRetry(getFullPlaylist, {
        id,
        token: this.token,
        adapterType: this.adapter,
      });
      if (source.status !== 200) return err(source);
      sourcePlaylists.push(source.data);
    }

    const targetPlaylistResult = await this.fetchOrCreatePlaylist({
      targetId,
      privacy,
      title: extractArtists.join(" & "),
      onAddedPlaylist,
    });
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    const queueItems: IAdapterPlaylistItem[] = sourcePlaylists
      .flatMap((p) => p.items)
      .filter((item) => extractArtists.includes(item.author));
    for (let index = 0; index < queueItems.length; index++) {
      const item = queueItems[index];
      if (!this.isShouldAddItem(targetPlaylist, item, allowDuplicates)) {
        continue;
      }

      onAddingPlaylistItem?.(item);
      const addedItem = await this.callApiWithRetry(addPlaylistItem, {
        playlistId: targetPlaylist.id,
        resourceId: item.videoId,
        token: this.token,
        adapterType: this.adapter,
      });
      if (addedItem.status !== 200) return err(addedItem);
      targetPlaylist.items.push(addedItem.data);
      onAddedPlaylistItem?.(addedItem.data, index, queueItems.length);
    }
    return ok(targetPlaylist);
  }

  public async delete(
    id: string,
  ): Promise<Result<IAdapterPlaylist, FailureData>> {
    const result = await this.callApiWithRetry(deletePlaylist, {
      id,
      token: this.token,
      adapterType: this.adapter,
    });
    return result.status === 200 ? ok(result.data) : err(result);
  }

  public async import({
    sourceId,
    privacy,
    allowDuplicates = false,
    onAddedPlaylist,
    onAddedPlaylistItem,
    onAddingPlaylistItem,
  }: ImportOptions): Promise<Result<IAdapterFullPlaylist, FailureData>> {
    const source = await this.callApiWithRetry(getFullPlaylist, {
      id: sourceId,
      token: this.token,
      adapterType: this.adapter,
    });
    if (source.status !== 200) return err(source);
    const sourcePlaylist = source.data;

    const targetPlaylistResult = await this.fetchOrCreatePlaylist({
      title: `${sourcePlaylist.title} - Imported`,
      privacy,
      onAddedPlaylist,
    });
    if (targetPlaylistResult.isErr()) return err(targetPlaylistResult.error);
    const targetPlaylist = targetPlaylistResult.value;

    for (const item of sourcePlaylist.items) {
      if (!this.isShouldAddItem(targetPlaylist, item, allowDuplicates)) {
        continue;
      }

      onAddingPlaylistItem?.(item);
      const addedItem = await this.callApiWithRetry(addPlaylistItem, {
        playlistId: targetPlaylist.id,
        resourceId: item.videoId,
        token: this.token,
        adapterType: this.adapter,
      });
      if (addedItem.status !== 200) return err(addedItem);
      targetPlaylist.items.push(addedItem.data);
      onAddedPlaylistItem?.(
        addedItem.data,
        targetPlaylist.items.length,
        sourcePlaylist.items.length,
      );
    }
    return ok(targetPlaylist);
  }

  public async getPlaylists(): Promise<
    Result<IAdapterPlaylist[], FailureData>
  > {
    const result = await this.callApiWithRetry(getPlaylists, {
      token: this.token,
      adapterType: this.adapter,
    });
    return result.status === 200 ? ok(result.data) : err(result);
  }

  public async getFullPlaylist(
    id: string,
  ): Promise<Result<IAdapterFullPlaylist, FailureData>> {
    const result = await this.callApiWithRetry(getFullPlaylist, {
      id,
      token: this.token,
      adapterType: this.adapter,
    });
    return result.status === 200 ? ok(result.data) : err(result);
  }

  /**
   * Fetch the playlist by id or create a new playlist with the given title.
   *
   * If the `targetId` is provided, it will fetch the playlist with that id.
   * If the `targetId` is NOT provided, it will create a new playlist with the given title.
   * @param param0
   * @returns
   */
  private async fetchOrCreatePlaylist({
    targetId,
    title,
    privacy,
    onAddedPlaylist,
  }: FetchOrCreatePlaylistOptions): Promise<
    Result<IAdapterFullPlaylist, FailureData>
  > {
    // Get the full playlist of the target.
    const target = targetId
      ? await this.callApiWithRetry(getFullPlaylist, {
          id: targetId,
          token: this.token,
          adapterType: this.adapter,
        })
      : null;
    if (target && target.status !== 200) return err(target);

    let targetPlaylist: IAdapterFullPlaylist;
    if (target) {
      targetPlaylist = target.data;
    } else {
      // Create a new playlist with the given title.
      const newPlaylist = await this.callApiWithRetry(addPlaylist, {
        title,
        privacy,
        token: this.token,
        adapterType: this.adapter,
      });
      if (newPlaylist.status !== 200) return err(newPlaylist);
      targetPlaylist = { ...newPlaylist.data, items: [] };
      onAddedPlaylist?.(targetPlaylist);
    }
    return ok(targetPlaylist);
  }

  /**
   * Call the API function with retry.
   * If the API returns a status code **200**, the result is returned.
   * If the API returns a status code **401**, the result is returned without retrying.
   * If the API returns a status code other than **200**, the API is retried up to MAX_RETRY times.
   * @param func
   * @param params
   * @returns
   */
  private async callApiWithRetry<T extends ApiCallFunction>(
    func: T,
    ...params: Parameters<T>
  ) {
    const MAX_RETRY = 0;
    let retry = 0;
    let result: Awaited<ReturnType<T>>;

    do {
      // @ts-expect-error
      result = await func(...params);
      if (result.status === 200) break;
      if (result.status === 401) break;
      await sleep(1000);
      retry++;
    } while (retry < MAX_RETRY);
    return result;
  }

  private validateRatio(ratio: number): boolean {
    return !!(0 <= ratio && 1 >= ratio);
  }

  /**
   * Whether the item exists in the playlist.
   * @param playlist
   * @param item
   * @returns
   */
  private existsItemInPlaylist(
    playlist: IAdapterFullPlaylist,
    item: IAdapterPlaylistItem,
  ): boolean {
    return playlist.items.some((i) => i.videoId === item.videoId);
  }

  /**
   * Whether to add the item to the playlist.
   * @param playlist
   * @param item
   * @param allowDuplicates
   * @returns
   */
  private isShouldAddItem(
    playlist: IAdapterFullPlaylist,
    item: IAdapterPlaylistItem,
    allowDuplicates: boolean,
  ): boolean {
    if (allowDuplicates) return true;
    return !this.existsItemInPlaylist(playlist, item);
  }

  /**
   * min <= x <= max の整数を返す
   * @param min
   * @param max
   */
  private getRandomInt(min: number, max: number) {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);

    return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
  }
}

type ApiCallFunction =
  | typeof getFullPlaylist
  | typeof getPlaylists
  | typeof addPlaylist
  | typeof addPlaylistItem
  | typeof updatePlaylistItemPosition
  | typeof deletePlaylist;

interface FetchOrCreatePlaylistOptions {
  targetId?: string;
  title: string;
  privacy?: AdapterPlaylistPrivacy;
  onAddedPlaylist?: OnAddedPlaylistHandler;
}

interface CopyOptions {
  /**
   * The id of the playlist to be copied.
   */
  sourceId: string;

  /**
   * The id of the playlist to be copied to.
   */
  targetId?: string;

  /**
   * Whether to allow duplicates in the target playlist.
   */
  allowDuplicates?: boolean;

  privacy?: AdapterPlaylistPrivacy;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
}

interface MergeOptions {
  /**
   * The ids of the playlists to be merged.
   */
  sourceIds: string[];

  /**
   * The id of the playlist to be merged to.
   */
  targetId?: string;

  /**
   * Whether to allow duplicates in the target playlist.
   */
  allowDuplicates?: boolean;

  privacy?: AdapterPlaylistPrivacy;
  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
}

interface ShuffleOptions {
  /**
   * The id of the playlist to be shuffled.
   */
  targetId: string;

  /**
   * プレイリストのアイテム中どのくらいの数ポジションを入れ替えるかの割合
   * 0 ~ 1
   */
  ratio: number;
  onUpdatingPlaylistItemPosition?: OnUpdatingPlaylistItemPositionHandler;
  onUpdatedPlaylistItemPosition?: OnUpdatedPlaylistItemPositionHandler;
}

interface ExtractOptions {
  /**
   * The id of the playlist to be extracted.
   */
  targetId?: string;

  /**
   * The ids of the playlists to be extracted.
   */
  sourceIds: string[];

  /**
   * The artists to be extracted.
   */
  extractArtists: string[];

  /**
   * Whether to allow duplicates in the target playlist.
   */
  allowDuplicates?: boolean;

  privacy?: AdapterPlaylistPrivacy;

  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
}

interface ImportOptions {
  sourceId: string;

  privacy?: AdapterPlaylistPrivacy;

  allowDuplicates?: boolean;

  onAddedPlaylist?: OnAddedPlaylistHandler;
  onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
  onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
}

/**
 * 新しいプレイリストが作成されたときに発火
 */
type OnAddedPlaylistHandler = (playlist: IAdapterPlaylist) => void;

/**
 * プレイリストのアイテムを追加し始める時に発火
 */
type OnAddingPlaylistItemHandler = (playlistItem: IAdapterPlaylistItem) => void;

/**
 * プレイリストのアイテム追加に成功したときに発火
 */
type OnAddedPlaylistItemHandler = (
  playlistItem: IAdapterPlaylistItem,
  currentIndex: number,
  totalLength: number,
) => void;

/**
 * プレイリストのアイテムのポジションを変更し始める時に発火
 */
type OnUpdatingPlaylistItemPositionHandler = (
  playlistItem: IAdapterPlaylistItem,
  oldIndex: number,
  newIndex: number,
) => void;

/**
 * プレイリストのアイテムのポジションの変更に成功に発火
 */
type OnUpdatedPlaylistItemPositionHandler = (
  playlistItem: IAdapterPlaylistItem,
  oldIndex: number,
  newIndex: number,
  completed: number,
  total: number,
) => void;
