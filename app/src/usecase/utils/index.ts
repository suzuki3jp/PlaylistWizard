import type { FullPlaylist, PlaylistItem } from "@/features/playlist/entities";

/**
 * Determines whether a playlist item should be added to a playlist.
 */
export function shouldAddItem(
  playlist: FullPlaylist,
  item: PlaylistItem,
  allowDuplicates: boolean,
) {
  if (allowDuplicates) return true;
  return !playlist.items.some(
    (playlistItem) => playlistItem.videoId === item.videoId,
  );
}
