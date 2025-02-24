import type { YoutubeAdapterErrorCodes } from "@/adapters/YouTubeAdapter";
import type {
    AdapterFullPlaylist,
    AdapterPlaylist,
    AdapterPlaylistItem,
} from "@/adapters/entities";

export type YoutubeErrorCodes =
    (typeof YoutubeAdapterErrorCodes)[keyof typeof YoutubeAdapterErrorCodes]["code"];

export interface Playlist {
    id: string;
    title: string;
    itemsTotal: number;
    thumbnail: string;
}

/**
 * `@/adapters/entities` の `Playlist` クラスからプレーンオブジェクトに変換
 */
export const convertToPlaylistFromClass = (
    data: AdapterPlaylist,
): Playlist => ({
    id: data.id,
    title: data.title,
    itemsTotal: data.itemsTotal,
    thumbnail: data.thumbnailUrl,
});

export type FullPlaylist = { items: PlaylistItem[] } & Playlist;

/**
 * `@/adapters/entities` の `FullPlaylist` クラスからプレーンオブジェクトに変換
 */
export const convertToFullPlaylistFromClass = (
    data: AdapterFullPlaylist,
): FullPlaylist => ({
    id: data.id,
    title: data.title,
    itemsTotal: data.itemsTotal,
    thumbnail: data.thumbnailUrl,
    items: data.items.map((i) => convertToPlaylistItemFromClass(i)),
});

export interface PlaylistItem {
    id: string;
    title: string;
    thumbnail: string;
    position: number;
    author: string;
    videoId: string;
}

/**
 * `@/adapters/entities` の `PlaylistItem` クラスからプレーンオブジェクトに変換
 */
export const convertToPlaylistItemFromClass = (
    data: AdapterPlaylistItem,
): PlaylistItem => ({
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnailUrl,
    position: data.position,
    author: data.author,
    videoId: data.videoId,
});
