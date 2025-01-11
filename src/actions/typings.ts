import type {
    FullPlaylist as FullPlaylistClass,
    Playlist as PlaylistClass,
    PlaylistItem as PlaylistItemClass,
} from "@/lib/base-adapter";
import type { YoutubeAdapterErrorCodes } from "@/lib/youtube-adapter";

export type YoutubeErrorCodes =
    (typeof YoutubeAdapterErrorCodes)[keyof typeof YoutubeAdapterErrorCodes]["code"];

export interface Playlist {
    id: string;
    title: string;
    itemsTotal: number;
    thumbnail: string;
}

/**
 * `@/lib/base-adapter` の `Playlist` クラスからプレーンオブジェクトに変換
 */
export const convertToPlaylistFromClass = (data: PlaylistClass): Playlist => ({
    id: data.getId,
    title: data.getTitle,
    itemsTotal: data.getItemsTotal,
    thumbnail: data.getThumbnailUrl,
});

export type FullPlaylist = { items: PlaylistItem[] } & Playlist;

/**
 * `@/lib/base-adapter` の `FullPlaylist` クラスからプレーンオブジェクトに変換
 */
export const convertToFullPlaylistFromClass = (
    data: FullPlaylistClass,
): FullPlaylist => ({
    id: data.getId,
    title: data.getTitle,
    itemsTotal: data.getItemsTotal,
    thumbnail: data.getThumbnailUrl,
    items: data.getItems.map((i) => convertToPlaylistItemFromClass(i)),
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
 * `@/lib/base-adapter` の `PlaylistItem` クラスからプレーンオブジェクトに変換
 */
export const convertToPlaylistItemFromClass = (
    data: PlaylistItemClass,
): PlaylistItem => ({
    id: data.getId,
    title: data.getTitle,
    thumbnail: data.getThumbnailUrl,
    position: data.getPosition,
    author: data.getAuthor,
    videoId: data.getVideoId,
});
