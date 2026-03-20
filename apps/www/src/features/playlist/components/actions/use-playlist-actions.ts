"use client";
import type { TFunction } from "i18next";
import {
  Copy,
  Funnel,
  GitMerge,
  ListX,
  Plus,
  RefreshCw,
  Search,
  Shuffle,
  Trash,
  Undo2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useT } from "@/presentation/hooks/t/client";
import { useHistory } from "../../contexts/history";
import { useSelectedPlaylists } from "../../contexts/selected-playlists";
import { useTask } from "../../contexts/tasks";
import { usePlaylistsQuery } from "../../queries/use-playlists";
import { BrowseAction } from "./browse-action";
import { CopyAction } from "./copy-action";
import { CreateAction } from "./create-action";
import { DeduplicateAction } from "./deduplicate-action";
import { DeleteAction } from "./delete-action";
import { ExtractAction } from "./extract-action";
import { MergeAction } from "./merge-action";
import { ShuffleAction } from "./shuffle-action";
import type { PlaylistAction } from "./types";
import { UndoAction } from "./undo-action";

const SyncAction = dynamic(() => import("./sync-action"), { ssr: false });

export function usePlaylistActions(t: TFunction): PlaylistAction[] {
  const { selectedPlaylists } = useSelectedPlaylists();
  const { tasks } = useTask();
  const history = useHistory();
  const { isPending } = usePlaylistsQuery();
  const { t: operationT } = useT("operation");

  const hasSelection = selectedPlaylists.length > 0;
  const hasMultipleSelection = selectedPlaylists.length >= 2;
  const hasBrowsableSelection = hasSelection && selectedPlaylists.length < 3;

  return [
    {
      id: "undo",
      icon: Undo2,
      label: "",
      disabled: !(history.undoable() && tasks.length === 0),
      Component: UndoAction,
      separatorAfter: true,
    },
    {
      id: "create",
      icon: Plus,
      label: t("playlists.create"),
      disabled: false,
      Component: CreateAction,
    },
    {
      id: "copy",
      icon: Copy,
      label: t("playlists.copy"),
      disabled: !hasSelection || isPending,
      Component: CopyAction,
    },
    {
      id: "shuffle",
      icon: Shuffle,
      label: t("playlists.shuffle"),
      disabled: !hasSelection || isPending,
      Component: ShuffleAction,
    },
    {
      id: "merge",
      icon: GitMerge,
      label: t("playlists.merge"),
      disabled: !hasMultipleSelection || isPending,
      Component: MergeAction,
    },
    {
      id: "extract",
      icon: Funnel,
      label: t("playlists.extract"),
      disabled: !hasSelection || isPending,
      Component: ExtractAction,
    },
    {
      id: "delete",
      icon: Trash,
      label: t("playlists.delete"),
      disabled: !hasSelection || isPending,
      Component: DeleteAction,
    },
    {
      id: "deduplicate",
      icon: ListX,
      label: t("playlists.deduplicate"),
      disabled: !hasSelection || isPending,
      Component: DeduplicateAction,
    },
    {
      id: "browse",
      icon: Search,
      label: t("playlists.browse"),
      disabled: !hasBrowsableSelection,
      Component: BrowseAction,
    },
    {
      id: "sync",
      icon: RefreshCw,
      label: operationT("sync.button"),
      disabled: false,
      Component: SyncAction,
    },
  ];
}
