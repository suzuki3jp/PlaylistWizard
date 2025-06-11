import { isNullish } from "@playlistwizard/shared";
import { type Result, err, ok } from "neverthrow";

import type { StructuredPlaylistDefinitionInterface } from "@/usecase/interface/structured-playlists";
export class StructuredPlaylistDefinitionJson {
  /**
   * Deserializes a JSON string into a structured playlist definition
   * @param raw
   * @returns
   */
  public deserialize(
    raw: string,
  ): Result<
    StructuredPlaylistDefinitionInterface,
    (typeof ErrorCode)[keyof typeof ErrorCode]
  > {
    try {
      const json = JSON.parse(raw);
      const checkResult = this.checkFieldTypes(json);

      return checkResult.isOk() ? ok(json) : err(checkResult.error);
    } catch (error) {
      return err(ErrorCode.UNKNOWN_ERROR);
    }
  }

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
  public noDependencyCycle(
    json: StructuredPlaylistDefinitionInterface,
  ): Result<void, { code: typeof ErrorCode.DEPENDENCY_CYCLE; path: string[] }> {
    // Build dependency graph: { [playlistId]: string[] }
    const graph: Record<string, string[]> = {};

    function buildGraph(
      playlists: StructuredPlaylistDefinitionInterface["playlists"],
    ) {
      for (const pl of playlists) {
        if (!graph[pl.id]) graph[pl.id] = [];
        if (pl.dependencies && Array.isArray(pl.dependencies)) {
          for (const dep of pl.dependencies) {
            graph[pl.id].push(dep.id);
            buildGraph([dep]);
          }
        }
      }
    }

    buildGraph(json.playlists);

    // DFS to detect cycle and record path
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const path: string[] = [];

    function dfs(id: string): string[] | null {
      if (visiting.has(id)) {
        // Cycle found, return the cycle path
        const cycleStart = path.indexOf(id);
        return path.slice(cycleStart).concat(id);
      }
      if (visited.has(id)) return null;
      visiting.add(id);
      path.push(id);
      for (const dep of graph[id] || []) {
        const cycle = dfs(dep);
        if (cycle) return cycle;
      }
      visiting.delete(id);
      path.pop();
      visited.add(id);
      return null;
    }

    for (const id of Object.keys(graph)) {
      const cycle = dfs(id);
      if (cycle) {
        return err({ code: ErrorCode.DEPENDENCY_CYCLE, path: cycle });
      }
    }

    return ok();
  }

  /**
   * Checks if the JSON object is a valid structured playlist definition
   * @param json
   * @returns
   */
  public isValidDefinition(
    json: Record<string, unknown>,
  ): json is StructuredPlaylistDefinitionInterface {
    return this.checkFieldTypes(json).isOk();
  }

  /**
   * Checks the field types of the JSON object
   *
   * @param json
   * @returns
   */
  public checkFieldTypes(
    json: Record<string, unknown>,
  ): Result<void, (typeof ErrorCode)[keyof typeof ErrorCode]> {
    // Check required fields
    if (
      isNullish(json.version) ||
      isNullish(json.name) ||
      isNullish(json.provider) ||
      isNullish(json.user_id) ||
      isNullish(json.playlists)
    ) {
      return err(ErrorCode.MISSING_FIELD);
    }

    // Check field types
    if (json.version !== 1) return err(ErrorCode.INVALID_VERSION);
    if (typeof json.name !== "string") return err(ErrorCode.INVALID_NAME);
    if (json.provider !== "google" && json.provider !== "spotify")
      return err(ErrorCode.INVALID_PROVIDER);
    if (typeof json.user_id !== "string")
      return err(ErrorCode.INVALID_PLAYLIST_ID);

    // Check playlists array
    if (!Array.isArray(json.playlists)) return err(ErrorCode.INVALID_PLAYLISTS);
    const checkResult = this.checkPlaylistTypes(json.playlists);
    if (checkResult.isErr()) return checkResult;

    return ok();
  }

  /**
   * Checks the types of the playlists array
   *
   * @param playlists
   * @returns
   */
  private checkPlaylistTypes(
    playlists: unknown[],
  ): Result<void, (typeof ErrorCode)[keyof typeof ErrorCode]> {
    if (!Array.isArray(playlists)) return err(ErrorCode.INVALID_PLAYLISTS);

    for (const playlist of playlists) {
      if (typeof playlist !== "object" || isNullish(playlist)) {
        return err(ErrorCode.INVALID_PLAYLIST);
      }

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (isNullish((playlist as any).id)) {
        return err(ErrorCode.MISSING_FIELD);
      }

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (typeof (playlist as any).id !== "string") {
        return err(ErrorCode.INVALID_PLAYLIST_ID);
      }

      // Check dependencies if they exist
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (!isNullish((playlist as any).dependencies)) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const dependencies = (playlist as any).dependencies;
        if (!Array.isArray(dependencies)) {
          return err(ErrorCode.INVALID_PLAYLISTS);
        }
        // Recursively check dependencies
        const result = this.checkPlaylistTypes(dependencies);
        if (result.isErr()) return result;
      }
    }

    return ok();
  }
}

const FieldTypeError = {
  MISSING_FIELD: "MISSING_FIELD",
  INVALID_NAME: "INVALID_NAME",
  INVALID_VERSION: "INVALID_VERSION",
  INVALID_PLAYLIST_ID: "INVALID_PLAYLIST_ID",
  INVALID_PLAYLISTS: "INVALID_PLAYLISTS",
  INVALID_PLAYLIST: "INVALID_PLAYLIST",
  INVALID_PROVIDER: "INVALID_PROVIDER",
} as const;

const ErrorCode = {
  ...FieldTypeError,
  DEPENDENCY_CYCLE: "DEPENDENCY_CYCLE",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export const StructuredPlaylistJsonDeserializeErrorCode = {
  ...ErrorCode,
} as const;
