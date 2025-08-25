"use client";
import { ChevronDown, ChevronRight, Music, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

import type { Playlist } from "@/entity";
import { Button } from "@/presentation/shadcn/button";

export type DependencyNode = {
  /**
   * This is not playlist ID, but a unique identifier for the node in the tree.
   */
  id: string;
  playlist: Playlist;
  parent: string | null;
  children: string[];
};

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

  addRoot: (playlist: Playlist, nodes: DependencyNode[]) => {
    const newNode: DependencyNode = {
      id: crypto.randomUUID(),
      playlist,
      parent: null,
      children: [],
    };

    return [...nodes, newNode];
  },

  addChild: (
    parentId: string,
    playlist: Playlist,
    nodes: DependencyNode[],
  ): DependencyNode[] | null => {
    const parent = NodeHelpers.getById(parentId, nodes);
    if (!parent) return null;

    const newNode: DependencyNode = {
      id: crypto.randomUUID(),
      playlist,
      parent: parentId,
      children: [],
    };

    return [
      ...nodes.map((n) =>
        n.id === parentId ? { ...n, children: [...n.children, newNode.id] } : n,
      ),
      newNode,
    ];
  },

  remove: (nodeId: string, nodes: DependencyNode[]): DependencyNode[] => {
    const node = NodeHelpers.getById(nodeId, nodes);
    if (!node) return nodes;

    return nodes
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
  },
} as const;

export function DependencyTree() {
  const [nodes, setNodes] = useState<DependencyNode[]>([]);
  const rootNodes = nodes.filter((node) => node.parent === null);
  const [isDragOverTree, setIsDragOverTree] = useState(false);

  // ルートプレイリストを追加
  const addRootPlaylist = useCallback(
    (playlist: Playlist) => {
      if (rootNodes.some((node) => node.playlist.id === playlist.id)) return;

      setNodes(NodeHelpers.addRoot(playlist, nodes));
    },
    [rootNodes, nodes],
  );

  const addChild = useCallback(
    (parentId: string, playlist: Playlist) => {
      const newNode = NodeHelpers.addChild(parentId, playlist, nodes);
      if (!newNode) return;
      setNodes(newNode);
    },
    [nodes],
  );

  // ノード削除時に子ノードを親に移動
  const removeNode = useCallback(
    (nodeId: string) => {
      const updatedNodes = NodeHelpers.remove(nodeId, nodes);
      setNodes(updatedNodes);
    },
    [nodes],
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
    } catch (error) {
      // エラーが発生した場合は何もしない
    }
  };

  return (
    <div className="lg:col-span-2">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">依存関係ツリー</h3>
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
              依存関係ツリーが空です
            </h4>
            <p className="mb-4 text-gray-400 text-sm">
              {isDragOverTree
                ? "ここにドロップしてルートプレイリストを追加"
                : "プレイリストをドラッグ&ドロップするか、ボタンでルートプレイリストを追加してください"}
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
}: DependencyNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

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
      // biome-ignore lint/suspicious/noConsole: <explanation>
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
                <span>{node.playlist.itemsTotal} 曲</span>
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
              title="子プレイリストを追加"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              onClick={() => removeNode(node.id)}
              title="削除（子は親に移動）"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children Count */}
        {node.children.length > 0 && (
          <div className="mt-2 text-gray-400 text-xs">
            {node.children.length} 個の依存プレイリスト
          </div>
        )}

        {/* Drop Zone Indicator */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-pink-500 border-dashed bg-pink-500/20">
            <span className="font-medium text-pink-400 text-sm">
              ここにドロップして子プレイリストを追加
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
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                node={NodeHelpers.getById(childId, nodes)!}
                nodes={nodes}
                addChild={addChild}
                removeNode={removeNode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
