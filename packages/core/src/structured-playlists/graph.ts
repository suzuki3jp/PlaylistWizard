import type { StructuredPlaylistsDefinitionPlaylist } from "./schema";

export type DependencyNode = StructuredPlaylistsDefinitionPlaylist;

/**
 * Sync planning output for the legacy in-process Sync implementation.
 * This is not the canonical Playlist Action Job Step type. When Sync moves into
 * Playlist Action Jobs, define new Step payloads for that execution contract
 * instead of reusing this legacy planning shape.
 */
export type StructuredPlaylistsSyncStep<TPlaylistId, TItem> = {
  type: "add_item";
  playlistId: TPlaylistId;
  item: TItem;
  sourcePlaylistId: string;
};

type PlanStructuredPlaylistsSyncStepsInput<TPlaylist, TItem, TPlaylistId> = {
  playlists: StructuredPlaylistsDefinitionPlaylist[];
  playlistsMap: Map<string, TPlaylist>;
  getItems: (playlist: TPlaylist) => TItem[];
  getVideoId: (item: TItem) => string;
  toPlaylistId: (playlistId: string) => TPlaylistId;
};

/**
 * Detects whether a Structured Playlists Definition contains a Dependency cycle.
 * Keeping this in core makes the Definition graph invariant shared by editor,
 * import, storage, and Sync code instead of re-implementing traversal per caller.
 */
export function hasDependencyCycle(input: {
  playlists: StructuredPlaylistsDefinitionPlaylist[];
}): boolean {
  const graph = buildDependencyGraph(input.playlists);
  const visited = new Set<string>();
  const visiting = new Set<string>();

  for (const playlistId of Object.keys(graph)) {
    if (!visited.has(playlistId)) {
      if (dfsHasCycle(playlistId, graph, visited, visiting)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects duplicate Dependency placements that make a Definition ambiguous.
 * The current product rules reject duplicate sibling IDs and repeated IDs on a
 * single root-to-leaf path; this preserves that behavior in one core Module.
 */
export function hasInvalidDependencies(input: {
  playlists: StructuredPlaylistsDefinitionPlaylist[];
}): boolean {
  for (const level of groupByLevel(input.playlists)) {
    const seen = new Set<string>();
    for (const id of level) {
      if (seen.has(id)) return true;
      seen.add(id);
    }
  }

  for (const path of listAllPaths(input.playlists)) {
    const seen = new Set<string>();
    for (const id of path) {
      if (seen.has(id)) return true;
      seen.add(id);
    }
  }

  return false;
}

/**
 * Lists every Playlist ID referenced by a Definition in first-seen traversal
 * order. Duplicate IDs collapse to the first occurrence, matching the previous
 * Sync fetch behavior.
 */
export function listPlaylistIds(
  playlists: StructuredPlaylistsDefinitionPlaylist[],
): string[] {
  const ids = new Set<string>();

  function collectIds(playlistArray: StructuredPlaylistsDefinitionPlaylist[]) {
    for (const playlist of playlistArray) {
      ids.add(playlist.id);
      if (playlist.dependencies) {
        collectIds(playlist.dependencies);
      }
    }
  }

  collectIds(playlists);
  return Array.from(ids);
}

/**
 * Plans Sync add-item work from a Definition and fetched Playlists.
 * The planner intentionally checks only the target Playlist's current Videos;
 * it does not simulate added items, preserving existing duplicate behavior
 * across multiple Dependencies.
 */
export function planStructuredPlaylistsSyncSteps<TPlaylist, TItem, TPlaylistId>(
  input: PlanStructuredPlaylistsSyncStepsInput<TPlaylist, TItem, TPlaylistId>,
): StructuredPlaylistsSyncStep<TPlaylistId, TItem>[] {
  const steps: StructuredPlaylistsSyncStep<TPlaylistId, TItem>[] = [];
  const processed = new Set<string>();

  const collectAllItems = (
    playlist: StructuredPlaylistsDefinitionPlaylist,
  ): Array<{ item: TItem; sourcePlaylistId: string }> => {
    const allItems: Array<{ item: TItem; sourcePlaylistId: string }> = [];

    if (playlist.dependencies) {
      for (const dependency of playlist.dependencies) {
        const sourcePlaylist = input.playlistsMap.get(dependency.id);
        if (sourcePlaylist) {
          for (const item of input.getItems(sourcePlaylist)) {
            allItems.push({ item, sourcePlaylistId: dependency.id });
          }
          allItems.push(...collectAllItems(dependency));
        }
      }
    }

    return allItems;
  };

  const processPlaylist = (playlist: StructuredPlaylistsDefinitionPlaylist) => {
    if (processed.has(playlist.id)) return;

    const targetPlaylist = input.playlistsMap.get(playlist.id);
    if (!targetPlaylist) return;

    if (playlist.dependencies) {
      for (const dependency of playlist.dependencies) {
        processPlaylist(dependency);
      }
    }

    const targetVideoIds = new Set(
      input.getItems(targetPlaylist).map(input.getVideoId),
    );

    for (const { item, sourcePlaylistId } of collectAllItems(playlist)) {
      if (!targetVideoIds.has(input.getVideoId(item))) {
        steps.push({
          type: "add_item",
          playlistId: input.toPlaylistId(playlist.id),
          item,
          sourcePlaylistId,
        });
      }
    }

    processed.add(playlist.id);
  };

  for (const playlist of input.playlists) {
    processPlaylist(playlist);
  }

  return steps;
}

/**
 * Groups Definition nodes by tree depth for duplicate sibling detection.
 */
export function groupByLevel(roots: DependencyNode[]): string[][] {
  const result: string[][] = [];
  let currentLevel: DependencyNode[] = roots;

  while (currentLevel.length > 0) {
    result.push(currentLevel.map((n) => n.id));

    const nextLevel: DependencyNode[] = [];
    for (const node of currentLevel) {
      if (node.dependencies) {
        nextLevel.push(...node.dependencies);
      }
    }
    currentLevel = nextLevel;
  }

  return result;
}

/**
 * Lists root-to-leaf paths for duplicate path detection.
 */
export function listAllPaths(nodes: DependencyNode[]): string[][] {
  const result: string[][] = [];

  function dfs(node: DependencyNode, path: string[]) {
    const newPath = [...path, node.id];
    if (!node.dependencies || node.dependencies.length === 0) {
      result.push(newPath);
      return;
    }

    for (const child of node.dependencies) {
      dfs(child, newPath);
    }
  }

  for (const node of nodes) {
    dfs(node, []);
  }

  return result;
}

function buildDependencyGraph(
  playlists: StructuredPlaylistsDefinitionPlaylist[],
): Record<string, string[]> {
  const graph: Record<string, string[]> = {};

  function addToGraph(playlist: StructuredPlaylistsDefinitionPlaylist): void {
    if (!graph[playlist.id]) {
      graph[playlist.id] = [];
    }

    if (playlist.dependencies) {
      for (const dependency of playlist.dependencies) {
        graph[playlist.id].push(dependency.id);
        addToGraph(dependency);
      }
    }
  }

  for (const playlist of playlists) {
    addToGraph(playlist);
  }

  return graph;
}

function dfsHasCycle(
  nodeId: string,
  graph: Record<string, string[]>,
  visited: Set<string>,
  visiting: Set<string>,
): boolean {
  visiting.add(nodeId);

  for (const dependencyId of graph[nodeId] || []) {
    if (visiting.has(dependencyId)) return true;

    if (!visited.has(dependencyId)) {
      if (dfsHasCycle(dependencyId, graph, visited, visiting)) {
        return true;
      }
    }
  }

  visiting.delete(nodeId);
  visited.add(nodeId);

  return false;
}
