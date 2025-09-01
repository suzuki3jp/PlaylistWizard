"use client";
import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "@playlistwizard/core/structured-playlists";
import type { WithT } from "i18next";
import { ChevronDown, ChevronRight, Music, Plus, Trash2 } from "lucide-react";
import { err, ok, type Result } from "neverthrow";
import Image from "next/image";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Playlist } from "@/entity";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/shadcn/button";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import {
  hasDependencyCycle,
  hasInvalidDependencies,
} from "@/repository/structured-playlists/dependency";
import type { PlaylistFetchState } from "./editor";

export type DependencyNode = {
  /**
   * This is not playlist ID, but a unique identifier for the node in the tree.
   */
  id: string;
  playlist: Playlist;
  parent: string | null;
  children: string[];
};
enum NodeOperationError {
  InvalidDependencies = "InvalidDependencies",
  NodeNotFound = "NodeNotFound",
  DependencyCycle = "DependencyCycle",
}

type NodeOperationResult = Result<DependencyNode[], NodeOperationError>;

function detectDependencyIssue(
  nodes: DependencyNode[],
): NodeOperationError | null {
  const json = NodeHelpers.toJSON(nodes, "dummy_user_id", "google"); // 検知するヘルパーがjsonを受け入れるように定義されているため変換する処理を入れる
  if (!json) return NodeOperationError.InvalidDependencies;

  if (hasDependencyCycle(json)) return NodeOperationError.DependencyCycle;
  if (hasInvalidDependencies(json))
    return NodeOperationError.InvalidDependencies;
  return null;
}

const STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY = "structured_playlists";

function applyChangesToLocalStorage(
  updatedDefinition: StructuredPlaylistsDefinition,
) {
  window.localStorage.setItem(
    STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY,
    JSON.stringify(updatedDefinition),
  );
}

function getStructuredPlaylistsFromLocalStorage(): StructuredPlaylistsDefinition | null {
  const data = window.localStorage.getItem(
    STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY,
  );
  if (!data) return null;

  function removeStructuredPlaylistsFromLocalStorage(): null {
    // biome-ignore lint/suspicious/noConsole: neccesary
    console.error(
      "Removing structured playlists from local storage due to failing parse. This is original data: ",
      data,
    );
    window.localStorage.removeItem(STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY);

    return null;
  }

  try {
    const parsed = JSON.parse(data);
    const result = StructuredPlaylistsDefinitionSchema.safeParse(parsed);
    if (!result.success) return removeStructuredPlaylistsFromLocalStorage();
    return result.data;
  } catch {
    return removeStructuredPlaylistsFromLocalStorage();
  }
}

/**
 * Exported only for testing purposes.
 */
export const NodeHelpers = {
  /**
   * Calculates the depth of a node in the dependency tree.
   */
  getDepth: (node: DependencyNode, nodes: DependencyNode[]) => {
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

  getById: (id: string, nodes: DependencyNode[]): DependencyNode | null => {
    return nodes.find((node) => node.id === id) || null;
  },

  addRoot: (
    playlist: Playlist,
    nodes: DependencyNode[],
  ): NodeOperationResult => {
    const newNode: DependencyNode = {
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
    nodes: DependencyNode[],
  ): NodeOperationResult => {
    const parent = NodeHelpers.getById(parentId, nodes);
    if (!parent) return err(NodeOperationError.NodeNotFound);

    const newNode: DependencyNode = {
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

  remove: (nodeId: string, nodes: DependencyNode[]): NodeOperationResult => {
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
    nodes: DependencyNode[],
    user_id: string,
    provider: ProviderRepositoryType,
  ): StructuredPlaylistsDefinition | null => {
    function buildDeps(
      node: DependencyNode,
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
  ): DependencyNode[] {
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
    const nodes: DependencyNode[] = [];
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

function handleNodeError(error: NodeOperationError, t: WithT["t"]) {
  if (error === NodeOperationError.NodeNotFound)
    return enqueueSnackbar(t("editor.dependency-tree.error.node-not-found"), {
      variant: "error",
    });
  if (error === NodeOperationError.InvalidDependencies)
    return enqueueSnackbar(
      t("editor.dependency-tree.error.invalid-dependencies"),
      { variant: "error" },
    );
  if (error === NodeOperationError.DependencyCycle)
    return enqueueSnackbar(t("editor.dependency-tree.error.dependency-cycle"), {
      variant: "error",
    });
}

export default function DependencyTreeSSR({
  t,
  playlistFetchState: [loading, playlists],
}: WithT & { playlistFetchState: PlaylistFetchState }) {
  const structuredPlaylistsFromLocalStorage = useMemo(
    () => getStructuredPlaylistsFromLocalStorage(),
    [],
  );

  const auth = useAuth();
  const [nodes, setNodes] = useState<DependencyNode[]>(
    structuredPlaylistsFromLocalStorage
      ? NodeHelpers.toNodes(
          structuredPlaylistsFromLocalStorage,
          playlists ?? [],
        )
      : [],
  );
  const rootNodes = nodes.filter((node) => node.parent === null);
  const [isDragOverTree, setIsDragOverTree] = useState(false);

  useEffect(() => {
    if (playlists && structuredPlaylistsFromLocalStorage) {
      setNodes(
        NodeHelpers.toNodes(structuredPlaylistsFromLocalStorage, playlists),
      );
    } else if (!structuredPlaylistsFromLocalStorage) {
      setNodes([]);
    }
  }, [playlists, structuredPlaylistsFromLocalStorage]);

  // ルートプレイリストを追加
  const addRootPlaylist = useCallback(
    (playlist: Playlist) => {
      if (rootNodes.some((node) => node.playlist.id === playlist.id)) return;

      const result = NodeHelpers.addRoot(playlist, nodes);
      if (result.isOk()) return setNodes(result.value);

      handleNodeError(result.error, t);
    },
    [rootNodes, nodes, t],
  );

  const addChild = useCallback(
    (parentId: string, playlist: Playlist) => {
      const result = NodeHelpers.addChild(parentId, playlist, nodes);
      if (result.isOk()) return setNodes(result.value);

      handleNodeError(result.error, t);
    },
    [nodes, t],
  );

  // ノード削除時に子ノードを親に移動
  const removeNode = useCallback(
    (nodeId: string) => {
      const result = NodeHelpers.remove(nodeId, nodes);
      if (result.isOk()) return setNodes(result.value);

      handleNodeError(result.error, t);
    },
    [nodes, t],
  );

  // 空のツリーエリアへのドロップハンドリング
  const handleTreeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOverTree(true);
  };

  const handleTreeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTree(false);
  };

  const handleTreeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTree(false);

    try {
      const playlistData = e.dataTransfer.getData("application/json");
      if (playlistData) {
        const playlist = JSON.parse(playlistData) as Playlist;

        addRootPlaylist(playlist);
      }
    } catch {
      // エラーが発生した場合は何もしない
    }
  };

  if (!auth) return null;
  const json = NodeHelpers.toJSON(nodes, auth.user.id, auth.provider);
  if (!json) {
    enqueueSnackbar(
      "This is a bug. Please report it on GitHub. You can find details of the issue in the console.",
      { variant: "error" },
    );
    return null;
  }
  applyChangesToLocalStorage(json);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="lg:col-span-2">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">
            {t("editor.dependency-tree.title")}
          </h3>
        </div>

        {rootNodes.length === 0 ? (
          <div
            className={`rounded-lg border-2 border-dashed py-16 text-center transition-colors ${
              isDragOverTree
                ? "border-pink-500 bg-pink-500/10"
                : "border-gray-700"
            }`}
            onDragOver={handleTreeDragOver}
            onDragLeave={handleTreeDragLeave}
            onDrop={handleTreeDrop}
            role="application"
          >
            <div className="mb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                <Plus className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            <h4 className="mb-2 font-medium text-gray-300 text-lg">
              {t("editor.dependency-tree.empty")}
            </h4>
            <p className="mb-4 text-gray-400 text-sm">
              {isDragOverTree
                ? t("editor.dependency-tree.drop-here")
                : t("editor.dependency-tree.empty-description")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootNodes.map((node, index) => (
              <DependencyNodeImpl
                key={`${node.id}-${index}`}
                node={node}
                nodes={nodes}
                addChild={addChild}
                removeNode={removeNode}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DependencyNodeProps {
  node: DependencyNode;
  nodes: DependencyNode[];
  addChild: (nodeId: string, child: Playlist) => void;
  removeNode: (nodeId: string) => void;
}

function DependencyNodeImpl({
  node,
  nodes,
  addChild,
  removeNode,
  t,
}: DependencyNodeProps & WithT) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [_showSelector, setShowSelector] = useState(false);

  const depth = NodeHelpers.getDepth(node, nodes);
  const indentSize = depth * 32; // For indent, calculate connection line length

  const handleAddChild = (playlist: Playlist) => {
    addChild(node.id, playlist);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // ensure the drag leave is outside the node
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const playlistData = e.dataTransfer.getData("application/json");
      if (playlistData) {
        const playlist = JSON.parse(playlistData) as Playlist;
        handleAddChild(playlist);
      }
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: This console.error is necessary for debugging
      console.error("Error parsing dropped data", error);
    }
  };

  return (
    <div className="relative">
      <div
        className={`relative z-10 rounded-lg border bg-gray-800 p-3 transition-colors ${
          isDragOver
            ? "border-pink-500 bg-pink-500/10"
            : "border-gray-700 hover:border-gray-600"
        }`}
        style={{ marginLeft: indentSize }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="application"
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Button */}
          {node.children.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Playlist Info */}
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={node.playlist.thumbnailUrl || "/assets/ogp.png"}
              alt={node.playlist.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-sm text-white">
              {node.playlist.title}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <Music className="h-3 w-3" />
                <span>
                  {t("editor.song-count", { count: node.playlist.itemsTotal })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-400 hover:bg-green-500/20 hover:text-green-300"
              onClick={() => setShowSelector(true)}
              title={t("editor.dependency-tree.add-child")}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              onClick={() => removeNode(node.id)}
              title={t("editor.dependency-tree.remove-node")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children Count */}
        {node.children.length > 0 && (
          <div className="mt-2 text-gray-400 text-xs">
            {t("editor.dependency-tree.dependencies", {
              count: node.children.length,
            })}
          </div>
        )}

        {/* Drop Zone Indicator */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-pink-500 border-dashed bg-pink-500/20">
            <span className="font-medium text-pink-400 text-sm">
              {t("editor.dependency-tree.drop-here-child")}
            </span>
          </div>
        )}
      </div>

      {/* Children with improved connection lines */}
      {isExpanded && node.children.length > 0 && (
        <div className="relative">
          <div className="mt-3 space-y-3">
            {node.children.map((childId) => (
              <DependencyNodeImpl
                key={childId}
                // biome-ignore lint/style/noNonNullAssertion: TODO
                node={NodeHelpers.getById(childId, nodes)!}
                nodes={nodes}
                addChild={addChild}
                removeNode={removeNode}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
