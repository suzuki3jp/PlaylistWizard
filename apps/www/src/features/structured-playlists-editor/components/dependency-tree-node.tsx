"use client";
import type { WithT } from "i18next";
import { ChevronDown, ChevronRight, Music, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { Button } from "@/components/ui/button";
import type { Playlist } from "@/features/playlist/entities";
import {
  type DependencyTreeNode as DependencyTreeNodeData,
  NodeHelpers,
} from "../libs/dependency-tree/node";

export interface DependencyTreeNodeProps {
  node: DependencyTreeNodeData;
  nodes: DependencyTreeNodeData[];
  addChild: (nodeId: string, child: Playlist) => void;
  removeNode: (nodeId: string) => void;
}

export function DependencyTreeNode({
  node,
  nodes,
  addChild,
  removeNode,
  t,
}: DependencyTreeNodeProps & WithT) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

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
            <ThumbnailImage
              src={node.playlist.thumbnailUrl}
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
              <DependencyTreeNode
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
