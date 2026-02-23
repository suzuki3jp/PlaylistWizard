"use client";
import type { WithT } from "i18next";
import { Download, Plus, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DependencyTreeNode } from "./dependency-tree-node";
import type { PlaylistFetchState } from "./editor";
import { useDependencyTree } from "./use-dependency-tree";

export function DependencyTree({
  t,
  playlistFetchState: [loading, playlists],
}: WithT & { playlistFetchState: PlaylistFetchState }) {
  const {
    nodes,
    rootNodes,
    isDirty,
    setFileInputRef,
    isDragOverTree,
    handleSave,
    addChild,
    removeNode,
    handleTreeDragOver,
    handleTreeDragLeave,
    handleTreeDrop,
    downloadJson,
    triggerFileImport,
    importJson,
  } = useDependencyTree({ t, playlists });

  if (loading) {
    return <DependencyTreeSkeleton t={t} />;
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
            <Button
              onClick={handleSave}
              disabled={!isDirty}
              size="sm"
              variant="ghost"
              className="h-8 gap-1 px-2 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              保存する
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
              <DependencyTreeNode
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

function DependencyTreeSkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 flex-shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function DependencyTreeSkeleton({ t }: WithT) {
  return (
    <div className="lg:col-span-2">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">
            {t("editor.dependency-tree.title")}
          </h3>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        <div className="space-y-3">
          <DependencyTreeSkeletonCard />
          <div className="ml-8 space-y-3">
            <DependencyTreeSkeletonCard />
            <div className="ml-8">
              <DependencyTreeSkeletonCard />
            </div>
          </div>
          <DependencyTreeSkeletonCard />
          <div className="ml-8">
            <DependencyTreeSkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}
