import { Err, Ok, type Result } from "result4js";

import type { AdapterPlaylistPrivacy, AdapterType } from "@/adapters";
import { sleep } from "@/utils";
import { addPlaylist } from "./add-playlist";
import { addPlaylistItem } from "./add-playlist-item";
import { deletePlaylist } from "./delete-playlist";
import { getFullPlaylist } from "./get-full-playlist";
import { getPlaylists } from "./get-playlists";
import type { Failure as FailureData } from "./result";
import type { FullPlaylist, Playlist, PlaylistItem } from "./typings";
import { updatePlaylistItemPosition } from "./update-playlist-item-position";

// TODO: 409 コンフリクトが起こったときはリクエストを再試行する
// TODO: failure の時操作のどのフェーズで失敗したかを含めることで、どこまでは操作が行われているかUIに表示する
export class PlaylistManager {
    private adapter: AdapterType;
    constructor(private token: string) {
        this.adapter = "YouTubeAdapter"; // TODO: AdapterType を動的に取得する
    }

    public async copy({
        sourceId,
        targetId,
        allowDuplicates = false,
        privacy,
        onAddedPlaylist,
        onAddedPlaylistItem,
        onAddingPlaylistItem,
    }: CopyOptions): Promise<Result<FullPlaylist, FailureData>> {
        // コピー対象の完全なプレイリストを取得
        const source = await this.callApiWithRetry(getFullPlaylist, {
            id: sourceId,
            token: this.token,
            adapterType: this.adapter,
        });
        if (source.status !== 200) return Err(source);
        const sourcePlaylist = source.data;

        // Get the full playlist of the target.
        // Or create a new playlist if the target does not exist.
        const target = targetId
            ? await this.callApiWithRetry(getFullPlaylist, {
                  id: targetId,
                  token: this.token,
                  adapterType: this.adapter,
              })
            : null;
        if (target && target.status !== 200) return Err(target);

        let targetPlaylist: FullPlaylist;

        if (target) {
            targetPlaylist = target.data;
        } else {
            const newTitle = `${sourcePlaylist.title} - Copied`;
            const newPlaylist = await this.callApiWithRetry(addPlaylist, {
                title: newTitle,
                privacy,
                token: this.token,
                adapterType: this.adapter,
            });
            if (newPlaylist.status !== 200) return Err(newPlaylist);
            targetPlaylist = { ...newPlaylist.data, items: [] };
            onAddedPlaylist?.(targetPlaylist);
        }

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
            if (addedItem.status !== 200) return Err(addedItem);

            targetPlaylist.items.push(addedItem.data);
            onAddedPlaylistItem?.(
                addedItem.data,
                index,
                sourcePlaylist.items.length,
            );
        }

        return Ok(targetPlaylist);
    }

    public async merge({
        sourceIds,
        targetId,
        allowDuplicates = false,
        privacy,
        onAddedPlaylist,
        onAddedPlaylistItem,
        onAddingPlaylistItem,
    }: MergeOptions): Promise<Result<FullPlaylist, FailureData>> {
        // Get the full playlists of the source.
        const sourcePlaylists: FullPlaylist[] = [];
        for (const id of sourceIds) {
            const source = await this.callApiWithRetry(getFullPlaylist, {
                id,
                token: this.token,
                adapterType: this.adapter,
            });
            if (source.status !== 200) return Err(source);
            sourcePlaylists.push(source.data);
        }

        // Get the full playlist of the target.
        // Or create a new playlist if the target does not exist.
        const target = targetId
            ? await this.callApiWithRetry(getFullPlaylist, {
                  id: targetId,
                  token: this.token,
                  adapterType: this.adapter,
              })
            : null;
        if (target && target.status !== 200) return Err(target);

        let targetPlaylist: FullPlaylist;

        if (target) {
            targetPlaylist = target.data;
        } else {
            // Create a new playlist with the title that combines the titles of the source playlists.
            // The title format of the new playlist: "playlist1 & playlist2 & playlist3 ... & playlistN"
            const title = sourcePlaylists.map((p) => p.title).join(" & ");
            const newPlaylist = await this.callApiWithRetry(addPlaylist, {
                title,
                privacy,
                token: this.token,
                adapterType: this.adapter,
            });
            if (newPlaylist.status !== 200) return Err(newPlaylist);
            targetPlaylist = { ...newPlaylist.data, items: [] };
            onAddedPlaylist?.(targetPlaylist);
        }

        // Add items to the target playlist.
        // If allowDuplicates is false, check if the item already exists in the target playlist.
        const queueItems: PlaylistItem[] = sourcePlaylists.flatMap(
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
            if (addedItem.status !== 200) return Err(addedItem);
            targetPlaylist.items.push(addedItem.data);
            onAddedPlaylistItem?.(addedItem.data, index, queueItems.length);
        }

        return Ok(targetPlaylist);
    }

    public async shuffle({
        targetId,
        ratio,
        onUpdatedPlaylistItemPosition,
        onUpdatingPlaylistItemPosition,
    }: ShuffleOptions): Promise<Result<Playlist, FailureData>> {
        if (!this.validateRatio(ratio)) throw new Error("Invalid ratio");

        // 対象の完全なプレイリストを取得
        const target = await this.callApiWithRetry(getFullPlaylist, {
            id: targetId,
            token: this.token,
            adapterType: this.adapter,
        });
        if (target.status !== 200) return Err(target);
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
            if (updatedItem.status !== 200) return Err(updatedItem);
            onUpdatedPlaylistItemPosition?.(
                updatedItem.data,
                targetItemIndex,
                targetItemNewIndex,
                i,
                itemMoveCount,
            );
        }

        return Ok(targetPlaylist);
    }

    public async delete(id: string): Promise<Result<Playlist, FailureData>> {
        const result = await this.callApiWithRetry(deletePlaylist, {
            id,
            token: this.token,
            adapterType: this.adapter,
        });
        return result.status === 200 ? Ok(result.data) : Err(result);
    }

    public async getPlaylists(): Promise<Result<Playlist[], FailureData>> {
        const result = await this.callApiWithRetry(getPlaylists, {
            token: this.token,
            adapterType: this.adapter,
        });
        return result.status === 200 ? Ok(result.data) : Err(result);
    }

    public async getFullPlaylist(
        id: string,
    ): Promise<Result<FullPlaylist, FailureData>> {
        const result = await this.callApiWithRetry(getFullPlaylist, {
            id,
            token: this.token,
            adapterType: this.adapter,
        });
        return result.status === 200 ? Ok(result.data) : Err(result);
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
        playlist: FullPlaylist,
        item: PlaylistItem,
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
        playlist: FullPlaylist,
        item: PlaylistItem,
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

/**
 * 新しいプレイリストが作成されたときに発火
 */
type OnAddedPlaylistHandler = (playlist: Playlist) => void;

/**
 * プレイリストのアイテムを追加し始める時に発火
 */
type OnAddingPlaylistItemHandler = (playlistItem: PlaylistItem) => void;

/**
 * プレイリストのアイテム追加に成功したときに発火
 */
type OnAddedPlaylistItemHandler = (
    playlistItem: PlaylistItem,
    currentIndex: number,
    totalLength: number,
) => void;

/**
 * プレイリストのアイテムのポジションを変更し始める時に発火
 */
type OnUpdatingPlaylistItemPositionHandler = (
    playlistItem: PlaylistItem,
    oldIndex: number,
    newIndex: number,
) => void;

/**
 * プレイリストのアイテムのポジションの変更に成功に発火
 */
type OnUpdatedPlaylistItemPositionHandler = (
    playlistItem: PlaylistItem,
    oldIndex: number,
    newIndex: number,
    completed: number,
    total: number,
) => void;
