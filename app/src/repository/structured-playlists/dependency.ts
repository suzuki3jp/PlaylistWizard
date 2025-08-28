import type { StructuredPlaylistsDefinition } from "./schema";

/**
 * Checks for dependency cycles in the playlists.
 * Returns ok() if no cycle, otherwise err with the cycle path.
 *
 * ## Dependency Cycle Detection Algorithm
 * The `noDependencyCycle` method constructs a directed graph where each playlist is a node and edges represent dependencies.
 * It then performs a DFS traversal for each node to detect cycles:
 * - If a node is revisited while still in the current DFS path (`visiting` set), a cycle is detected and the path is returned.
 * - If a node has already been fully explored (`visited` set), it is skipped.
 * - The algorithm records the traversal path to accurately report the cycle.
 * - If any cycle is found, the method returns an error with the cycle path; otherwise, it returns success.
 *
 * The class also provides utility methods to check for required fields, validate field types, and recursively validate nested playlist dependencies.
 */
export function hasDependencyCycle(
  json: StructuredPlaylistsDefinition,
): boolean {
  const graph = buildDependencyGraph(json.playlists);
  const visited = new Set<string>();
  const visiting = new Set<string>();

  // Check each playlist for cycles using DFS
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
 * Builds a dependency graph from playlists where keys are playlist IDs
 * and values are arrays of their dependency IDs
 */
function buildDependencyGraph(
  playlists: StructuredPlaylistsDefinition["playlists"],
): Record<string, string[]> {
  const graph: Record<string, string[]> = {};

  function addToGraph(
    playlist: StructuredPlaylistsDefinition["playlists"][number],
  ): void {
    if (!graph[playlist.id]) {
      graph[playlist.id] = [];
    }

    if (playlist.dependencies) {
      for (const dependency of playlist.dependencies) {
        graph[playlist.id].push(dependency.id);
        // Recursively add dependencies to graph
        addToGraph(dependency);
      }
    }
  }

  for (const playlist of playlists) {
    addToGraph(playlist);
  }

  return graph;
}

/**
 * Performs DFS to detect cycles in the dependency graph
 */
function dfsHasCycle(
  nodeId: string,
  graph: Record<string, string[]>,
  visited: Set<string>,
  visiting: Set<string>,
): boolean {
  // Mark as currently being visited
  visiting.add(nodeId);

  // Check all dependencies
  const dependencies = graph[nodeId] || [];
  for (const dependencyId of dependencies) {
    // If we encounter a node that's currently being visited, we found a cycle
    if (visiting.has(dependencyId)) {
      return true;
    }

    // If not visited yet, recursively check
    if (!visited.has(dependencyId)) {
      if (dfsHasCycle(dependencyId, graph, visited, visiting)) {
        return true;
      }
    }
  }

  // Mark as fully visited and remove from visiting
  visiting.delete(nodeId);
  visited.add(nodeId);

  return false;
}

/**
 * Detect invalid dependencies in the playlist structure.
 * For example, same playlist as a dependency, or same playlist as a sibling.
 */
export function hasInvalidDependencies(
  definition: StructuredPlaylistsDefinition,
): boolean {
  // detect sibling issue
  const levels = groupByLevel(definition.playlists);
  for (const level of levels) {
    const seen = new Set<string>();
    for (const id of level) {
      if (seen.has(id)) {
        return true; // Sibling issue found
      }
      seen.add(id);
    }
  }

  // detect self dependencies
  const paths = listAllPaths(definition.playlists);
  for (const path of paths) {
    const seen = new Set<string>();
    for (const id of path) {
      if (seen.has(id)) {
        return true; // Duplicate found in path
      }
      seen.add(id);
    }
  }

  return false;
}

export type DependencyNode = StructuredPlaylistsDefinition["playlists"][number];

/**
 * This function exported only testing purpose
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
 * This function exported only testing purpose
 */
export function listAllPaths(nodes: DependencyNode[]): string[][] {
  const result: string[][] = [];

  function dfs(node: DependencyNode, path: string[]) {
    const newPath = [...path, node.id];
    if (!node.dependencies || node.dependencies.length === 0) {
      // 葉ノードの場合、パスを保存
      result.push(newPath);
    } else {
      // 子ノードを再帰的に探索
      for (const child of node.dependencies) {
        dfs(child, newPath);
      }
    }
  }

  for (const node of nodes) {
    dfs(node, []);
  }

  return result;
}
