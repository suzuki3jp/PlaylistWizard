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

/**
 * Returns the subset of sourceItems that should be added to the target playlist.
 * Handles deduplication within the source batch as well as against existing target items.
 */
export function filterItemsToAdd(
  sourceItems: PlaylistItem[],
  targetItems: PlaylistItem[],
  allowDuplicates: boolean,
): PlaylistItem[] {
  if (allowDuplicates) return [...sourceItems];
  const seen = new Set(targetItems.map((item) => item.videoId));
  const result: PlaylistItem[] = [];
  for (const item of sourceItems) {
    if (!seen.has(item.videoId)) {
      result.push(item);
      seen.add(item.videoId);
    }
  }
  return result;
}
