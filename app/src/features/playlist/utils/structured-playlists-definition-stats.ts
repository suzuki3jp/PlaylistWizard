import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import type { Playlist } from "@/features/playlist/entities";

export type PlaylistDefinition =
  StructuredPlaylistsDefinition["playlists"][number];

export function collectAllPlaylistDefs(
  playlistDefs: PlaylistDefinition[],
): PlaylistDefinition[] {
  const result: PlaylistDefinition[] = [];
  for (const def of playlistDefs) {
    result.push(def);
    if (def.dependencies) {
      result.push(...collectAllPlaylistDefs(def.dependencies));
    }
  }
  return result;
}

export function calculateDefinitionStats(
  definition: StructuredPlaylistsDefinition,
  playlists: Playlist[],
) {
  const allDefs = collectAllPlaylistDefs(definition.playlists);
  const playlistMap = new Map(playlists.map((p) => [p.id, p]));

  let totalTracks = 0;
  let unknownCount = 0;

  for (const def of allDefs) {
    const playlist = playlistMap.get(def.id);
    if (playlist) {
      totalTracks += playlist.itemsTotal;
    } else {
      unknownCount++;
    }
  }

  return {
    totalPlaylists: allDefs.length,
    totalTracks,
    unknownCount,
  };
}
