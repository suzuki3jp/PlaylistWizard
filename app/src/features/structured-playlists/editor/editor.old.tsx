"use client";

import type React from "react";

import {
  Copy,
  Download,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/presentation/shadcn/button";

import { ChevronDown, ChevronRight, Music } from "lucide-react";
import Image from "next/image";

import { Input } from "@/presentation/shadcn/input";
import { Search, X } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
  thumbnail: string;
  itemCount: number;
  platform: "youtube" | "spotify";
}

interface SimplePlaylistCardProps {
  playlist: Playlist;
}

export function SimplePlaylistCard({ playlist }: SimplePlaylistCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(playlist));
    e.dataTransfer.effectAllowed = "copy";
  };

  const getPlatformIcon = () => {
    if (playlist.platform === "spotify") {
      return (
        <svg
          className="h-4 w-4 text-[#1DB954]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      );
    } else {
      return (
        <svg
          className="h-4 w-4 text-red-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    }
  };

  return (
    <div
      className="cursor-grab rounded-lg border border-gray-700 bg-gray-800 p-3 transition-colors hover:border-gray-600 active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
          <Image
            src={playlist.thumbnail || "/assets/ogp.png"}
            alt={playlist.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-medium text-sm text-white">
            {playlist.name}
          </h4>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Music className="h-3 w-3" />
              <span>{playlist.itemCount} 曲</span>
            </div>
            {getPlatformIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Playlist {
  id: string;
  name: string;
  thumbnail: string;
  itemCount: number;
  platform: "youtube" | "spotify";
}

interface PlaylistSelectorProps {
  playlists: Playlist[];
  onSelect: (playlist: Playlist) => void;
  onClose: () => void;
  title?: string;
}

export function PlaylistSelector({
  playlists,
  onSelect,
  onClose,
  title = "プレイリストを選択",
}: PlaylistSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-gray-700 bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-gray-700 border-b p-4">
          <h3 className="font-semibold text-lg text-white">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="border-gray-700 border-b p-4">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
            <Input
              placeholder="プレイリストを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-700 bg-gray-800 pl-10 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPlaylists.length > 0 ? (
            <div className="space-y-2">
              {filteredPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-800"
                  onClick={() => onSelect(playlist)}
                >
                  <SimplePlaylistCard playlist={playlist} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-400">
                {searchTerm
                  ? "検索条件に一致するプレイリストがありません"
                  : "プレイリストがありません"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-gray-700 border-t p-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
          >
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Playlist {
  id: string;
  name: string;
  thumbnail: string;
  itemCount: number;
  platform: "youtube" | "spotify";
}

interface TreeNode {
  id: string;
  playlist: Playlist;
  children: TreeNode[];
}

interface EnhancedDependencyTreeProps {
  node: TreeNode;
  path: number[];
  availablePlaylists: Playlist[];
  onAddChild: (parentPath: number[], playlist: Playlist) => void;
  onRemove: (path: number[]) => void;
  level?: number;
  isLastChild?: boolean;
  parentHasMoreSiblings?: boolean;
}

export function EnhancedDependencyTree({
  node,
  path,
  availablePlaylists,
  onAddChild,
  onRemove,
  level = 0,
  isLastChild = false,
  parentHasMoreSiblings = false,
}: EnhancedDependencyTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const getPlatformIcon = () => {
    if (node.playlist.platform === "spotify") {
      return (
        <svg
          className="h-4 w-4 text-[#1DB954]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      );
    } else {
      return (
        <svg
          className="h-4 w-4 text-red-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    }
  };

  const handleAddChild = (playlist: Playlist) => {
    onAddChild(path, playlist);
    setShowSelector(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const playlistData = e.dataTransfer.getData("application/json");
      if (playlistData) {
        const playlist = JSON.parse(playlistData) as Playlist;
        onAddChild(path, playlist);
      }
    } catch (error) {
      // エラーが発生した場合は何もしない
    }
  };

  const indentLevel = level * 32;
  const nodeHeight = 80; // ノード間の間隔

  return (
    <div className="relative">
      {/* Connection Lines */}
      {level > 0 && (
        <>
          {/* 親からの垂直線 */}
          <div
            className="absolute w-px bg-gray-600"
            style={{
              left: indentLevel - 16,
              top: -nodeHeight + 24, // 前のノードの中央から
              height: nodeHeight, // 現在のノードの中央まで
            }}
          />
          {/* 水平線 */}
          <div
            className="absolute h-px bg-gray-600"
            style={{
              left: indentLevel - 16,
              top: 24, // ノードの中央
              width: 16,
            }}
          />
        </>
      )}

      {/* Node */}
      <div
        className={`relative z-10 rounded-lg border bg-gray-800 p-3 transition-colors ${
          isDragOver
            ? "border-pink-500 bg-pink-500/10"
            : "border-gray-700 hover:border-gray-600"
        }`}
        style={{ marginLeft: indentLevel }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
              src={node.playlist.thumbnail || "/assets/ogp.png"}
              alt={node.playlist.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-sm text-white">
              {node.playlist.name}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <Music className="h-3 w-3" />
                <span>{node.playlist.itemCount} 曲</span>
              </div>
              {getPlatformIcon()}
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
              onClick={() => onRemove(path)}
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
          {/* 子ノードへの垂直線 */}
          <div
            className="absolute w-px bg-gray-600"
            style={{
              left: indentLevel + 16,
              top: 24, // 現在のノードの中央から開始
              height: node.children.length * nodeHeight - 24, // 最後の子ノードの中央まで
            }}
          />

          <div className="mt-3 space-y-3">
            {node.children.map((child, index) => (
              <EnhancedDependencyTree
                key={`${child.id}-${index}`}
                node={child}
                path={[...path, index]}
                availablePlaylists={availablePlaylists}
                onAddChild={onAddChild}
                onRemove={onRemove}
                level={level + 1}
                isLastChild={index === node.children.length - 1}
                parentHasMoreSiblings={!isLastChild}
              />
            ))}
          </div>
        </div>
      )}

      {/* Playlist Selector Modal */}
      {showSelector && (
        <PlaylistSelector
          playlists={availablePlaylists}
          onSelect={handleAddChild}
          onClose={() => setShowSelector(false)}
          title="子プレイリストを選択"
        />
      )}
    </div>
  );
}

interface Playlist {
  id: string;
  name: string;
  thumbnail: string;
  itemCount: number;
  platform: "youtube" | "spotify";
}

interface TreeNode {
  id: string;
  playlist: Playlist;
  children: TreeNode[];
}

interface DependencyNode {
  id: string;
  dependencies?: DependencyNode[];
}

interface DependencyStructure {
  version: number;
  provider: string;
  playlists: DependencyNode[];
}

export default function DependencyBuilderPage() {
  // サンプルプレイリストデータ
  const [availablePlaylists] = useState<Playlist[]>([
    {
      id: "playlist-id-1",
      name: "お気に入り",
      thumbnail: "/assets/ogp.png?height=60&width=60",
      itemCount: 45,
      platform: "youtube",
    },
    {
      id: "playlist-id-2",
      name: "作業用BGM",
      thumbnail: "/assets/ogp.png?height=60&width=60",
      itemCount: 32,
      platform: "youtube",
    },
    {
      id: "playlist-id-3",
      name: "ドライブミックス",
      thumbnail: "/assets/ogp.png?height=60&width=60",
      itemCount: 28,
      platform: "youtube",
    },
    {
      id: "playlist-id-4",
      name: "リラックス",
      thumbnail: "/assets/ogp.png?height=60&width=60",
      itemCount: 19,
      platform: "spotify",
    },
    {
      id: "playlist-id-5",
      name: "エクササイズ",
      thumbnail: "/assets/ogp.png?height=60&width=60",
      itemCount: 41,
      platform: "spotify",
    },
    {
      id: "playlist-id-6",
      name: "パーティー",
      thumbnail: "/assets/ogp.png?height=60&width=60",
      itemCount: 67,
      platform: "youtube",
    },
    {
      id: "playlist-id-7",
      name: "勉強用",
      thumbnail: "/assets/ogp.png?height=60&width=60",
      itemCount: 23,
      platform: "spotify",
    },
    {
      id: "playlist-id-8",
      name: "睡眠用",
      thumbnail: "/assets/ogp.png?height=60&width=60",
      itemCount: 15,
      platform: "youtube",
    },
  ]);

  const [rootNodes, setRootNodes] = useState<TreeNode[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [showRootSelector, setShowRootSelector] = useState(false);
  const [isDragOverTree, setIsDragOverTree] = useState(false);

  // 利用可能なプレイリスト（全て利用可能）
  const availableForSelection = useMemo(() => {
    return availablePlaylists;
  }, [availablePlaylists]);

  // ルートプレイリストを追加
  const addRootPlaylist = useCallback((playlist: Playlist) => {
    setRootNodes((prev) => {
      // 既に存在するプレイリストIDかチェック（最新の状態を使用）
      const checkExists = (playlistId: string, nodes: TreeNode[]): boolean => {
        for (const node of nodes) {
          if (node.id === playlistId) {
            return true;
          }
          if (checkExists(playlistId, node.children)) {
            return true;
          }
        }
        return false;
      };

      if (checkExists(playlist.id, prev)) {
        return prev; // 既に存在する場合は何もしない
      }

      const newNode: TreeNode = {
        id: playlist.id,
        playlist,
        children: [],
      };
      return [...prev, newNode];
    });
    setShowRootSelector(false);
  }, []);

  // 子プレイリストを追加
  const addChildPlaylist = useCallback(
    (parentPath: number[], playlist: Playlist) => {
      setRootNodes((prev) => {
        // 既に存在するプレイリストIDかチェック（最新の状態を使用）
        const checkExists = (
          playlistId: string,
          nodes: TreeNode[],
        ): boolean => {
          for (const node of nodes) {
            if (node.id === playlistId) {
              return true;
            }
            if (checkExists(playlistId, node.children)) {
              return true;
            }
          }
          return false;
        };

        if (checkExists(playlist.id, prev)) {
          return prev; // 既に存在する場合は何もしない
        }

        const newChild: TreeNode = {
          id: playlist.id,
          playlist,
          children: [],
        };

        const newRoots = [...prev];
        let current = newRoots[parentPath[0]];

        // パスを辿って親ノードを見つける
        for (let i = 1; i < parentPath.length; i++) {
          current = current.children[parentPath[i]];
        }

        current.children = [...current.children, newChild];
        return newRoots;
      });
    },
    [],
  );

  // ノード削除時に子ノードを親に移動
  const removeNode = useCallback((path: number[]) => {
    if (path.length === 1) {
      // ルートノードの削除
      setRootNodes((prev) => {
        const nodeToRemove = prev[path[0]];
        const newRoots = prev.filter((_, index) => index !== path[0]);

        // 削除するノードの子をルートレベルに移動
        return [...newRoots, ...nodeToRemove.children];
      });
    } else {
      // 子ノードの削除
      setRootNodes((prev) => {
        const newRoots = [...prev];
        let current = newRoots[path[0]];

        // 親ノードまで辿る
        for (let i = 1; i < path.length - 1; i++) {
          current = current.children[path[i]];
        }

        // 削除対象のノードとその子を取得
        const nodeToRemove = current.children[path[path.length - 1]];

        // 削除対象のノードを除去し、その子を親の子に追加
        current.children = [
          ...current.children.filter(
            (_, index) => index !== path[path.length - 1],
          ),
          ...nodeToRemove.children,
        ];

        return newRoots;
      });
    }
  }, []);

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

  // JSONを生成
  const generateJson = useCallback(() => {
    const buildDependencyTree = (node: TreeNode): DependencyNode => {
      const result: DependencyNode = { id: node.id };
      if (node.children.length > 0) {
        result.dependencies = node.children.map(buildDependencyTree);
      }
      return result;
    };

    const result: DependencyStructure = {
      version: 1,
      provider: "google",
      playlists: rootNodes.map(buildDependencyTree),
    };

    const jsonString = JSON.stringify(result, null, 2);
    setJsonOutput(jsonString);
    return jsonString;
  }, [rootNodes]);

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="container py-8">
        <div className="flex flex-col space-y-6">
          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Available Playlists */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <h3 className="mb-4 font-semibold text-lg text-white">
                  利用可能なプレイリスト
                </h3>
                <p className="mb-4 text-gray-400 text-sm">
                  プレイリストをドラッグして依存関係ツリーに追加できます
                </p>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {availableForSelection.map((playlist) => (
                    <SimplePlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                  {availableForSelection.length === 0 && (
                    <div className="py-8 text-center text-gray-400">
                      <p>プレイリストがありません</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dependency Tree */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-white">
                    依存関係ツリー
                  </h3>
                  <Button
                    onClick={() => setShowRootSelector(true)}
                    className="bg-pink-600 text-white hover:bg-pink-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    ルートプレイリスト追加
                  </Button>
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
                    <Button
                      onClick={() => setShowRootSelector(true)}
                      className="bg-pink-600 text-white hover:bg-pink-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      ルートプレイリスト追加
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rootNodes.map((node, index) => (
                      <EnhancedDependencyTree
                        key={`${node.id}-${index}`}
                        node={node}
                        path={[index]}
                        availablePlaylists={availableForSelection}
                        onAddChild={addChildPlaylist}
                        onRemove={removeNode}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* JSON Output */}
          {showJson && (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-white">
                  生成されたJSON
                </h3>
                <Button
                  onClick={generateJson}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  更新
                </Button>
              </div>
              <div className="max-h-96 overflow-auto rounded-lg border border-gray-700 bg-gray-950 p-4">
                <pre className="whitespace-pre-wrap text-gray-300 text-sm">
                  {jsonOutput || generateJson()}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Root Playlist Selector Modal */}
      {showRootSelector && (
        <PlaylistSelector
          playlists={availableForSelection}
          onSelect={addRootPlaylist}
          onClose={() => setShowRootSelector(false)}
          title="ルートプレイリストを選択"
        />
      )}
    </div>
  );
}
