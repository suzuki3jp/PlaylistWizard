import {
  groupByLevel,
  hasDependencyCycle as coreHasDependencyCycle,
  hasInvalidDependencies as coreHasInvalidDependencies,
  listAllPaths,
  type StructuredPlaylistsDefinition,
  type StructuredPlaylistsDefinitionPlaylist,
} from "@playlistwizard/core/structured-playlists";

/**
 * This Module is kept as a compatibility seam for existing www callers.
 * New Structured Playlists code should import graph helpers directly from
 * `@playlistwizard/core/structured-playlists` so the Definition rules stay in core.
 */
export type DependencyNode = StructuredPlaylistsDefinitionPlaylist;

/** Detects Dependency cycles while preserving the existing www import path. */
export function hasDependencyCycle(
  json: StructuredPlaylistsDefinition,
): boolean {
  return coreHasDependencyCycle({ playlists: json.playlists });
}

/** Detects invalid Dependency placements while preserving the existing import path. */
export function hasInvalidDependencies(
  definition: StructuredPlaylistsDefinition,
): boolean {
  return coreHasInvalidDependencies({ playlists: definition.playlists });
}

export { groupByLevel, listAllPaths };
