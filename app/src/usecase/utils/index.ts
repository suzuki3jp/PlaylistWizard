import type {
  FullPlaylistInterface,
  PrimitivePlaylistItemInterface,
} from "@/entity";

/**
 * Determines whether a playlist item should be added to a playlist.
 */
export function shouldAddItem(
  playlist: FullPlaylistInterface,
  item: PrimitivePlaylistItemInterface,
  allowDuplicates: boolean,
) {
  if (allowDuplicates) return true;
  return !playlist.items.some(
    (playlistItem) => playlistItem.videoId === item.videoId,
  );
}
