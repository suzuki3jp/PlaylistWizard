"use client";
import { StructuredPlaylistsDefinitionSchema } from "@playlistwizard/core/structured-playlists";
import type { WithT } from "i18next";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useRef, useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { useNavigationGuard } from "@/common/use-navigation-guard";
import { ga4Events } from "@/constants";
import { Provider } from "@/entities/provider";
import type { Playlist } from "@/features/playlist/entities";
import { useStructuredPlaylistsDefinition } from "@/features/structured-playlists-definition/context";
import { useSession } from "@/lib/auth-client";
import {
  type DependencyTreeNode,
  DependencyTreeNodeOperationError,
  NodeHelpers,
} from "../libs/dependency-tree/node";

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

interface UseDependencyTreeArgs {
  t: WithT["t"];
  playlists: Playlist[] | undefined;
}

export function useDependencyTree({ t, playlists }: UseDependencyTreeArgs) {
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(
    null,
  );

  const [contextData, save] = useStructuredPlaylistsDefinition();
  const initialDefinition = useRef(contextData).current;

  const { data: session } = useSession();

  const [nodesPopulated, setNodesPopulated] = useState<boolean>(() => {
    return !!initialDefinition && playlists !== undefined;
  });

  const [nodes, _setNodes] = useState<DependencyTreeNode[]>(() => {
    if (!initialDefinition || playlists === undefined) return [];
    return NodeHelpers.toNodes(initialDefinition, playlists);
  });

  const [isDirty, setIsDirty] = useState(false);
  useNavigationGuard(isDirty);

  const setNodes = useCallback((newNodes: DependencyTreeNode[]) => {
    _setNodes(newNodes);
    setIsDirty(true);
    emitGa4Event(ga4Events.updateStructuredPlaylistDefinition);
  }, []);

  const rootNodes = nodes.filter((node) => node.parent === null);
  const [isDragOverTree, setIsDragOverTree] = useState(false);

  // initialDefinition は useRef で固定された値なので依存配列から除外
  // biome-ignore lint/correctness/useExhaustiveDependencies: initialDefinition is intentionally stable (captured from ref at mount)
  useEffect(() => {
    if (playlists !== undefined) {
      if (initialDefinition) {
        _setNodes(NodeHelpers.toNodes(initialDefinition, playlists));
      }
      setNodesPopulated(true);
    } else if (!initialDefinition) {
      _setNodes([]);
      setNodesPopulated(true);
    }
  }, [playlists]);

  const handleSave = useCallback(async () => {
    if (!session) return;
    // Structured playlists currently only support YouTube (Google); update when Spotify is added
    const json = NodeHelpers.toJSON(nodes, session.user.id, Provider.GOOGLE);
    if (!json) return;
    try {
      await save(json);
      setIsDirty(false);
      enqueueSnackbar(t("editor.dependency-tree.save.success"), {
        variant: "success",
      });
    } catch {
      enqueueSnackbar(t("editor.dependency-tree.save.failure"), {
        variant: "error",
      });
    }
  }, [nodes, session, save, t]);

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

  const removeNode = useCallback(
    (nodeId: string) => {
      const result = NodeHelpers.remove(nodeId, nodes);
      if (result.isOk()) return setNodes(result.value);

      handleNodeError(result.error, t);
    },
    [nodes, t, setNodes],
  );

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

  function downloadJson() {
    if (!session) return;
    const DOWNLOAD_JSON_FILENAME = "structured_playlists.json";
    // Structured playlists currently only support YouTube (Google); update when Spotify is added
    const json = NodeHelpers.toJSON(nodes, session.user.id, Provider.GOOGLE);
    if (!json) return;

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

  return {
    nodes,
    rootNodes,
    nodesPopulated,
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
  };
}
