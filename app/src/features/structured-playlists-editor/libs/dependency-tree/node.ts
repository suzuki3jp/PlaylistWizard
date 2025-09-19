import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "@playlistwizard/core/structured-playlists";
import { err, ok, type Result } from "neverthrow";
import { Playlist } from "@/features/playlist";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import {
  hasDependencyCycle,
  hasInvalidDependencies,
} from "@/repository/structured-playlists/dependency";

export type DependencyTreeNode = {
  /**
   * This is not playlist ID, but a unique identifier for the node in the tree.
   */
  id: string;
  playlist: Playlist;
  parent: string | null;
  children: string[];
};

export enum DependencyTreeNodeOperationError {
  InvalidDependencies = "InvalidDependencies",
  NodeNotFound = "NodeNotFound",
  DependencyCycle = "DependencyCycle",
}

type NodeOperationResult = Result<
  DependencyTreeNode[],
  DependencyTreeNodeOperationError
>;

function detectDependencyIssue(
  nodes: DependencyTreeNode[],
): DependencyTreeNodeOperationError | null {
  const json = NodeHelpers.toJSON(nodes, "dummy_user_id", "google"); // 検知するヘルパーがjsonを受け入れるように定義されているため変換する処理を入れる
  if (!json) return DependencyTreeNodeOperationError.InvalidDependencies;

  if (hasDependencyCycle(json))
    return DependencyTreeNodeOperationError.DependencyCycle;
  if (hasInvalidDependencies(json))
    return DependencyTreeNodeOperationError.InvalidDependencies;
  return null;
}

export const NodeHelpers = {
  /**
   * Calculates the depth of a node in the dependency tree.
   */
  getDepth: (node: DependencyTreeNode, nodes: DependencyTreeNode[]) => {
    let depth = 0;
    let currentNode = node;

    while (currentNode.parent) {
      const parentNode = nodes.find((n) => n.id === currentNode.parent);
      if (!parentNode) break;
      depth++;
      currentNode = parentNode;
    }

    return depth;
  },

  getById: (
    id: string,
    nodes: DependencyTreeNode[],
  ): DependencyTreeNode | null => {
    return nodes.find((node) => node.id === id) || null;
  },

  addRoot: (
    playlist: Playlist,
    nodes: DependencyTreeNode[],
  ): NodeOperationResult => {
    const newNode: DependencyTreeNode = {
      id: crypto.randomUUID(),
      playlist,
      parent: null,
      children: [],
    };

    const updatedNodes = [...nodes, newNode];
    const issue = detectDependencyIssue(updatedNodes);
    if (issue) return err(issue);

    return ok(updatedNodes);
  },

  addChild: (
    parentId: string,
    playlist: Playlist,
    nodes: DependencyTreeNode[],
  ): NodeOperationResult => {
    const parent = NodeHelpers.getById(parentId, nodes);
    if (!parent) return err(DependencyTreeNodeOperationError.NodeNotFound);

    const newNode: DependencyTreeNode = {
      id: crypto.randomUUID(),
      playlist,
      parent: parentId,
      children: [],
    };

    const updatedNodes = [
      ...nodes.map((n) =>
        n.id === parentId ? { ...n, children: [...n.children, newNode.id] } : n,
      ),
      newNode,
    ];
    const issue = detectDependencyIssue(updatedNodes);
    if (issue) return err(issue);

    return ok(updatedNodes);
  },

  remove: (
    nodeId: string,
    nodes: DependencyTreeNode[],
  ): NodeOperationResult => {
    const node = NodeHelpers.getById(nodeId, nodes);
    if (!node) return ok(nodes);

    const updatedNodes = nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => {
        if (n.id === node.parent) {
          n.children.push(...node.children);
          n.children = n.children.filter((id) => id !== nodeId);
        }

        if (node.children.includes(n.id)) {
          n.parent = node.parent;
        }

        return n;
      });

    const issue = detectDependencyIssue(updatedNodes);
    if (issue) return err(issue);

    return ok(updatedNodes);
  },

  toJSON: (
    nodes: DependencyTreeNode[],
    user_id: string,
    provider: ProviderRepositoryType,
  ): StructuredPlaylistsDefinition | null => {
    function buildDeps(
      node: DependencyTreeNode,
    ): StructuredPlaylistsDefinition["playlists"][number] {
      return {
        id: node.playlist.id,
        dependencies: node.children
          .map((childId) => {
            const child = nodes.find((n) => n.id === childId);
            return child ? buildDeps(child) : undefined;
          })
          .filter((v) => v !== undefined),
      };
    }

    const root = nodes.filter((node) => node.parent === null);
    const json = {
      version: 1,
      name: "placeholder",
      user_id,
      provider,
      playlists: root.map(buildDeps),
    };
    const result = StructuredPlaylistsDefinitionSchema.safeParse(json);
    if (!result.success) {
      // biome-ignore lint/suspicious/noConsole: This is needed for debugging
      console.error("Error serializing dependency tree to JSON", result.error);
      return null;
    }
    return result.data;
  },

  toNodes(
    definition: StructuredPlaylistsDefinition,
    playlists: Playlist[],
  ): DependencyTreeNode[] {
    // Helper to find Playlist by id, or create a dummy if not found
    const findPlaylist = (id: string): Playlist => {
      const found = playlists.find((p) => p.id === id);
      if (found) return found;
      // Create a dummy Playlist object (minimum required fields)
      return new Playlist({
        id,
        title: `Unknown Playlist (${id})`,
        itemsTotal: 0,
        thumbnailUrl: "",
        url: "",
      });
    };

    // Recursively build nodes and assign unique ids
    const nodes: DependencyTreeNode[] = [];
    const idMap = new Map<string, string>(); // playlist.id -> node.id

    function buildNodes(
      playlistDef: StructuredPlaylistsDefinition["playlists"][number],
      parent: string | null,
    ) {
      // Generate a unique node id for this playlist
      const nodeId = crypto.randomUUID();
      idMap.set(playlistDef.id, nodeId);

      const playlist = findPlaylist(playlistDef.id);
      // Children will be filled after all nodes are created
      nodes.push({
        id: nodeId,
        playlist,
        parent,
        children: [], // will fill later
      });

      // Recursively build children
      for (const dep of playlistDef.dependencies || []) {
        buildNodes(dep, nodeId);
      }
    }

    // Build all nodes (roots)
    for (const root of definition.playlists) {
      buildNodes(root, null);
    }

    // After all nodes are created, fill children arrays
    for (const node of nodes) {
      // Find the playlistDef for this node
      const playlistDef = (function findDef(
        defs: StructuredPlaylistsDefinition["playlists"],
        id: string,
      ): StructuredPlaylistsDefinition["playlists"][number] | undefined {
        for (const def of defs) {
          if (def.id === id) return def;
          const found = findDef(def.dependencies || [], id);
          if (found) return found;
        }
        return undefined;
      })(definition.playlists, node.playlist.id);
      if (!playlistDef) continue;
      node.children = (playlistDef.dependencies || [])
        .map((dep) => idMap.get(dep.id))
        .filter((id): id is string => !!id);
    }

    return nodes;
  },
} as const;
