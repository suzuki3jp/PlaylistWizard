import type { PlaylistPrivacy } from "@/lib/base-adapter";
import { Err, Ok, type Result } from "@/lib/result";
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
	constructor(private token: string) {}

	public async copy({
		sourceId,
		privacy,
		onAddedPlaylist,
		onAddedPlaylistItem,
		onAddingPlaylistItem,
	}: CopyOptions): Promise<Result<FullPlaylist, FailureData>> {
		// コピー対象の完全なプレイリストを取得
		const source = await this.callApiWithRetry(getFullPlaylist, {
			id: sourceId,
			token: this.token,
		});
		if (source.status !== 200) return Err(source);
		const sourcePlaylist = source.data;

		// 新しいプレイリストを作成する
		const newTitle = `${sourcePlaylist.title} - Copied`;
		const newTarget = await this.callApiWithRetry(addPlaylist, {
			title: newTitle,
			privacy,
			token: this.token,
		});
		if (newTarget.status !== 200) return Err(newTarget);
		const newPlaylist: FullPlaylist = { ...newTarget.data, items: [] };
		onAddedPlaylist?.(newPlaylist);

		// アイテムを追加する
		for (let index = 0; index < sourcePlaylist.items.length; index++) {
			const item = sourcePlaylist.items[index];
			onAddingPlaylistItem?.(item);
			const addedItem = await this.callApiWithRetry(addPlaylistItem, {
				playlistId: newPlaylist.id,
				resourceId: item.videoId,
				token: this.token,
			});
			if (addedItem.status !== 200) return Err(addedItem);

			newPlaylist.items.push(addedItem.data);
			onAddedPlaylistItem?.(addedItem.data, index, sourcePlaylist.items.length);
		}

		return Ok(newPlaylist);
	}

	public async merge({
		sourceIds,
		privacy,
		onAddedPlaylist,
		onAddedPlaylistItem,
		onAddingPlaylistItem,
	}: MergeOptions): Promise<Result<FullPlaylist, FailureData>> {
		// ターゲットの完全なプレイリストを取得する
		const sourcePlaylists: FullPlaylist[] = [];
		for (const id of sourceIds) {
			const source = await this.callApiWithRetry(getFullPlaylist, {
				id,
				token: this.token,
			});
			if (source.status !== 200) return Err(source);
			sourcePlaylists.push(source.data);
		}

		// 入力されたプレイリストのタイトルを新しいプレイリストのタイトルに変換し、新しいプレイリストを作成する
		// 新しいプレイリストのタイトルフォーマット: "playlist1 & playlist2 & playlist3 ... & playlistN"
		const title = sourcePlaylists.map((p) => p.title).join(" & ");
		const newPlaylistResult = await this.callApiWithRetry(addPlaylist, {
			title,
			privacy,
			token: this.token,
		});
		if (newPlaylistResult.status !== 200) return Err(newPlaylistResult);
		const newPlaylist: FullPlaylist = { ...newPlaylistResult.data, items: [] };
		onAddedPlaylist?.(newPlaylist);

		// 新しいプレイリストにアイテムを追加
		const queueItems: PlaylistItem[] = sourcePlaylists.flatMap((p) => p.items);
		for (const item of queueItems) {
			onAddingPlaylistItem?.(item);
			const addedItem = await this.callApiWithRetry(addPlaylistItem, {
				playlistId: newPlaylist.id,
				resourceId: item.videoId,
				token: this.token,
			});
			if (addedItem.status !== 200) return Err(addedItem);
			newPlaylist.items.push(addedItem.data);
			onAddedPlaylistItem?.(
				addedItem.data,
				newPlaylist.items.length,
				queueItems.length,
			);
		}

		return Ok(newPlaylist);
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
		});
		return result.status === 200 ? Ok(result.data) : Err(result);
	}

	public async getPlaylists(): Promise<Result<Playlist[], FailureData>> {
		const result = await this.callApiWithRetry(getPlaylists, {
			token: this.token,
		});
		return result.status === 200 ? Ok(result.data) : Err(result);
	}

	public async getFullPlaylist(
		id: string,
	): Promise<Result<FullPlaylist, FailureData>> {
		const result = await this.callApiWithRetry(getFullPlaylist, {
			id,
			token: this.token,
		});
		return result.status === 200 ? Ok(result.data) : Err(result);
	}

	private async callApiWithRetry<T extends ApiCallFunction>(
		func: T,
		...params: Parameters<T>
	) {
		const MAX_RETRY = 3;
		let retry = 0;
		let result: Awaited<ReturnType<T>>;

		do {
			// @ts-expect-error
			result = await func(...params);
			if (result.status === 200) break;
			await sleep(1000);
			retry++;
		} while (retry < MAX_RETRY);
		return result;
	}

	private validateRatio(ratio: number): boolean {
		return !!(0 <= ratio && 1 >= ratio);
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

export type ApiCallFunction =
	| typeof getFullPlaylist
	| typeof getPlaylists
	| typeof addPlaylist
	| typeof addPlaylistItem
	| typeof updatePlaylistItemPosition
	| typeof deletePlaylist;

export interface CopyOptions {
	/**
	 * The id of the playlist to be copied.
	 */
	sourceId: string;
	privacy?: PlaylistPrivacy;
	onAddedPlaylist?: OnAddedPlaylistHandler;
	onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
	onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
}

export interface MergeOptions {
	/**
	 * The ids of the playlists to be merged.
	 */
	sourceIds: string[];
	privacy?: PlaylistPrivacy;
	onAddedPlaylist?: OnAddedPlaylistHandler;
	onAddingPlaylistItem?: OnAddingPlaylistItemHandler;
	onAddedPlaylistItem?: OnAddedPlaylistItemHandler;
}

export interface ShuffleOptions {
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
export type OnAddedPlaylistHandler = (playlist: Playlist) => void;

/**
 * プレイリストのアイテムを追加し始める時に発火
 */
export type OnAddingPlaylistItemHandler = (playlistItem: PlaylistItem) => void;

/**
 * プレイリストのアイテム追加に成功したときに発火
 */
export type OnAddedPlaylistItemHandler = (
	playlistItem: PlaylistItem,
	currentIndex: number,
	totalLength: number,
) => void;

/**
 * プレイリストのアイテムのポジションを変更し始める時に発火
 */
export type OnUpdatingPlaylistItemPositionHandler = (
	playlistItem: PlaylistItem,
	oldIndex: number,
	newIndex: number,
) => void;

/**
 * プレイリストのアイテムのポジションの変更に成功に発火
 */
export type OnUpdatedPlaylistItemPositionHandler = (
	playlistItem: PlaylistItem,
	oldIndex: number,
	newIndex: number,
	completed: number,
	total: number,
) => void;
