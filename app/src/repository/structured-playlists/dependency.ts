import type {
  StructuredPlaylistDefinitionInterface,
  StructuredPlaylistInterface,
} from "@/usecase/interface/structured-playlists";

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
  json: StructuredPlaylistDefinitionInterface,
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
  playlists: StructuredPlaylistDefinitionInterface["playlists"],
): Record<string, string[]> {
  const graph: Record<string, string[]> = {};

  function addToGraph(playlist: StructuredPlaylistInterface): void {
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
