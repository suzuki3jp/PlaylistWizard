import type {
  FullPlaylist,
  Playlist,
  PlaylistItem,
} from "@/features/playlist/entities";

/**
 * 新しいプレイリストが作成されたときに発火
 */
export type OnAddedPlaylistHandler = (
  playlist: Playlist | FullPlaylist,
) => void;

/**
 * プレイリストのアイテムを追加し始める時に発火
 */
export type OnAddingPlaylistItemHandler = (playlistItem: PlaylistItem) => void;

/**
 * プレイリストのアイテム追加に成功したときに発火
 */
export type OnAddedPlaylistItemHandler = (
  playlistItem: PlaylistItem,
  playlist: Playlist | FullPlaylist,
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
