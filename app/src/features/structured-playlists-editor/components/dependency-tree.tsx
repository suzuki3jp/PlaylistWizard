"use client";
import {
  StructuredPlaylistsDefinitionLocalStorage,
  StructuredPlaylistsDefinitionSchema,
} from "@playlistwizard/core/structured-playlists";
import type { WithT } from "i18next";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Music,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ga4Events, urls } from "@/constants";
import type { Playlist } from "@/features/playlist/entities";
import { useAuth } from "@/presentation/hooks/useAuth";
import {
  type DependencyTreeNode,
  DependencyTreeNodeOperationError,
  NodeHelpers,
} from "../libs/dependency-tree/node";
import type { PlaylistFetchState } from "./editor";

function handleNodeError(
  error: DependencyTreeNodeOperationError,
  t: WithT["t"],
) {
  if (error === DependencyTreeNodeOperationError.NodeNotFound)
    return enqueueSnackbar(t("editor.dependency-tree.error.node-not-found"), {
      variant: "error",
    });
  if (error === DependencyTreeNodeOperationError.InvalidDependencies)
    return enqueueSnackbar(
      t("editor.dependency-tree.error.invalid-dependencies"),
      { variant: "error" },
    );
  if (error === DependencyTreeNodeOperationError.DependencyCycle)
    return enqueueSnackbar(t("editor.dependency-tree.error.dependency-cycle"), {
      variant: "error",
    });
}

export default function DependencyTreeSSR({
  t,
  playlistFetchState: [loading, playlists],
}: WithT & { playlistFetchState: PlaylistFetchState }) {
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(
    null,
  );

  const structuredPlaylistsFromLocalStorage = useMemo(() => {
    const result = StructuredPlaylistsDefinitionLocalStorage.get();

    if (result.isOk()) {
      return result.value;
    } else {
      // biome-ignore lint/suspicious/noConsole: neccesary
      console.error(
        "Removing structured playlists from local storage due to failing parse. This is original data: ",
        result.error,
      );
      StructuredPlaylistsDefinitionLocalStorage.remove();
      return null;
    }
  }, []);

  const auth = useAuth();
  const [nodes, _setNodes] = useState<DependencyTreeNode[]>(
    structuredPlaylistsFromLocalStorage
      ? NodeHelpers.toNodes(
          structuredPlaylistsFromLocalStorage,
          playlists ?? [],
        )
      : [],
  );

  const setNodes = useCallback((newNodes: DependencyTreeNode[]) => {
    _setNodes(newNodes);
    emitGa4Event(ga4Events.updateStructuredPlaylistDefinition);
  }, []);

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
  }, [playlists, structuredPlaylistsFromLocalStorage, setNodes]);

  // ルートプレイリストを追加
  const addRootPlaylist = useCallback(
    (playlist: Playlist) => {
      if (rootNodes.some((node) => node.playlist.id === playlist.id)) return;

      const result = NodeHelpers.addRoot(playlist, nodes);
      if (result.isOk()) return setNodes(result.value);

      handleNodeError(result.error, t);
    },
    [rootNodes, nodes, t, setNodes],
  );

  const addChild = useCallback(
    (parentId: string, playlist: Playlist) => {
      const result = NodeHelpers.addChild(parentId, playlist, nodes);
      if (result.isOk()) return setNodes(result.value);

      handleNodeError(result.error, t);
    },
    [nodes, t, setNodes],
  );

  // ノード削除時に子ノードを親に移動
  const removeNode = useCallback(
    (nodeId: string) => {
      const result = NodeHelpers.remove(nodeId, nodes);
      if (result.isOk()) return setNodes(result.value);

      handleNodeError(result.error, t);
    },
    [nodes, t, setNodes],
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
  StructuredPlaylistsDefinitionLocalStorage.set(json);

  if (loading) {
    return <p>Loading...</p>;
  }

  function downloadJson() {
    const DOWNLOAD_JSON_FILENAME = "structured_playlists.json";

    const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = DOWNLOAD_JSON_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    emitGa4Event(ga4Events.exportStructuredPlaylistDefinition);
  }

  function triggerFileImport() {
    fileInputRef?.click();
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsed = JSON.parse(text?.toString() || "");
        const result = StructuredPlaylistsDefinitionSchema.safeParse(parsed);
        if (!result.success) {
          // biome-ignore lint/suspicious/noConsole: TODO: display error to user
          return console.error("Invalid structured playlists JSON");
        }

        setNodes(NodeHelpers.toNodes(result.data, playlists ?? []));
      } catch {
        // biome-ignore lint/suspicious/noConsole: TODO: display error to user
        console.error("Error parsing JSON file");
      }
    };
    reader.readAsText(file);

    emitGa4Event(ga4Events.importStructuredPlaylistDefinition);
  }

  return (
    <div className="lg:col-span-2">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">
            {t("editor.dependency-tree.title")}
          </h3>
          <div className="flex items-center gap-1">
            <Input
              type="file"
              accept="application/json"
              className="hidden"
              ref={setFileInputRef}
              onChange={importJson}
            />
            <Button
              onClick={triggerFileImport}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
              title="JSONをインポート"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={downloadJson}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-400 hover:bg-green-500/20 hover:text-green-300"
              title="JSONをエクスポート"
              disabled={rootNodes.length === 0}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
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
              <DependencyTreeNodeImpl
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

interface DependencyTreeNodeProps {
  node: DependencyTreeNode;
  nodes: DependencyTreeNode[];
  addChild: (nodeId: string, child: Playlist) => void;
  removeNode: (nodeId: string) => void;
}

function DependencyTreeNodeImpl({
  node,
  nodes,
  addChild,
  removeNode,
  t,
}: DependencyTreeNodeProps & WithT) {
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
              src={
                node.playlist.thumbnailUrl === urls.youtubeApiNoThumbnail()
                  ? urls.youtubeNoThumbnailProxy()
                  : node.playlist.thumbnailUrl || "/assets/ogp.png"
              }
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
              <DependencyTreeNodeImpl
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
