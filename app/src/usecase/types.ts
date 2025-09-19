import type {
  PrimitivePlaylistInterface,
  PrimitivePlaylistItemInterface,
} from "@/features/playlist";

/**
 * 新しいプレイリストが作成されたときに発火
 */
export type OnAddedPlaylistHandler = (
  playlist: PrimitivePlaylistInterface,
) => void;

/**
 * プレイリストのアイテムを追加し始める時に発火
 */
export type OnAddingPlaylistItemHandler = (
  playlistItem: PrimitivePlaylistItemInterface,
) => void;

/**
 * プレイリストのアイテム追加に成功したときに発火
 */
export type OnAddedPlaylistItemHandler = (
  playlistItem: PrimitivePlaylistItemInterface,
  playlist: PrimitivePlaylistInterface,
  currentIndex: number,
  totalLength: number,
) => void;

/**
 * プレイリストのアイテムのポジションを変更し始める時に発火
 */
export type OnUpdatingPlaylistItemPositionHandler = (
  playlistItem: PrimitivePlaylistItemInterface,
  oldIndex: number,
  newIndex: number,
) => void;

/**
 * プレイリストのアイテムのポジションの変更に成功に発火
 */
export type OnUpdatedPlaylistItemPositionHandler = (
  playlistItem: PrimitivePlaylistItemInterface,
  oldIndex: number,
  newIndex: number,
  completed: number,
  total: number,
) => void;
