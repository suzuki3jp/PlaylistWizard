import { type PlaylistId, toPlaylistId, type VideoId } from "../ids";
import {
  listPlaylistIds,
  planStructuredPlaylistsSyncSteps,
  type StructuredPlaylistsDefinition,
} from "../structured-playlists";

export type SyncAddPlaylistItemOperation = {
  playlistId: PlaylistId;
  videoId: VideoId;
};

/**
 * Lists the Playlists a Sync must read before planning. Each ID appears once
 * even when the Definition places the same Playlist under several parents.
 */
export const listSyncPlaylistIds = (
  definition: StructuredPlaylistsDefinition,
): PlaylistId[] => listPlaylistIds(definition.playlists).map(toPlaylistId);

/**
 * Plans Sync additions as execution-ready (Playlist, Video) pairs.
 *
 * The planning rules stay in `planStructuredPlaylistsSyncSteps`; this only
 * narrows its legacy output to the fields an add operation needs. Duplicate
 * additions that the planner emits (for example, the same Video reachable from
 * two Dependencies of an empty target) are intentionally kept as separate
 * operations so the Job path matches the in-browser Sync result.
 */
export const planSyncAddPlaylistItems = (input: {
  definition: StructuredPlaylistsDefinition;
  /** Video IDs of every Playlist in the Definition, as read before planning. */
  playlistVideoIds: ReadonlyMap<PlaylistId, readonly VideoId[]>;
}): SyncAddPlaylistItemOperation[] => {
  const playlistsMap = new Map<string, readonly VideoId[]>(
    input.playlistVideoIds,
  );

  return planStructuredPlaylistsSyncSteps({
    playlists: input.definition.playlists,
    playlistsMap,
    getItems: (videoIds) => [...videoIds],
    getVideoId: (videoId) => videoId,
    toPlaylistId,
  }).map((step) => ({ playlistId: step.playlistId, videoId: step.item }));
};
