"use client";
import { Search } from "lucide-react";

import type { WithT } from "@/@types";
import { Input } from "@/components/ui/input";
import { BrowseButton } from "./browse-button";
import { CopyButton } from "./copy-button";
import { DeleteButton } from "./delete-button";
import { ExtractButton } from "./extract-button";
import { MergeButton } from "./merge-button";
import type { PlaylistState, TaskFunctions } from "./playlists-root";
import { ShuffleButton } from "./shuffle-button";

export interface PlaylistActionsProps extends WithT {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  playlists: PlaylistState[];
  refreshPlaylists: () => Promise<void>;
  createTask: TaskFunctions["createTask"];
  updateTaskMessage: TaskFunctions["updateMessage"];
  updateTaskProgress: TaskFunctions["updateProgress"];
  updateTaskStatus: TaskFunctions["updateStatus"];
  removeTask: TaskFunctions["removeTask"];
}

export interface PlaylistActionProps extends WithT {
  playlists: PlaylistState[];
  refreshPlaylists: () => Promise<void>;
  createTask: TaskFunctions["createTask"];
  updateTaskMessage: TaskFunctions["updateMessage"];
  updateTaskProgress: TaskFunctions["updateProgress"];
  updateTaskStatus: TaskFunctions["updateStatus"];
  removeTask: TaskFunctions["removeTask"];
}

export function PlaylistActions({
  t,
  searchQuery,
  setSearchQuery,
  playlists,
  refreshPlaylists,
  createTask,
  updateTaskMessage,
  updateTaskProgress,
  updateTaskStatus,
  removeTask,
}: PlaylistActionsProps) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-wrap gap-2">
        <CopyButton
          t={t}
          playlists={playlists}
          refreshPlaylists={refreshPlaylists}
          createTask={createTask}
          updateTaskMessage={updateTaskMessage}
          updateTaskProgress={updateTaskProgress}
          updateTaskStatus={updateTaskStatus}
          removeTask={removeTask}
        />
        <ShuffleButton
          t={t}
          playlists={playlists}
          refreshPlaylists={refreshPlaylists}
          createTask={createTask}
          updateTaskMessage={updateTaskMessage}
          updateTaskProgress={updateTaskProgress}
          updateTaskStatus={updateTaskStatus}
          removeTask={removeTask}
        />
        <MergeButton
          t={t}
          playlists={playlists}
          refreshPlaylists={refreshPlaylists}
          createTask={createTask}
          updateTaskMessage={updateTaskMessage}
          updateTaskProgress={updateTaskProgress}
          updateTaskStatus={updateTaskStatus}
          removeTask={removeTask}
        />
        <ExtractButton
          t={t}
          playlists={playlists}
          refreshPlaylists={refreshPlaylists}
          createTask={createTask}
          removeTask={removeTask}
          updateTaskMessage={updateTaskMessage}
          updateTaskProgress={updateTaskProgress}
          updateTaskStatus={updateTaskStatus}
        />
        <DeleteButton
          t={t}
          playlists={playlists}
          refreshPlaylists={refreshPlaylists}
          createTask={createTask}
          removeTask={removeTask}
          updateTaskMessage={updateTaskMessage}
          updateTaskProgress={updateTaskProgress}
          updateTaskStatus={updateTaskStatus}
        />
        <BrowseButton t={t} playlists={playlists} />
      </div>

      <div className="relative w-full md:w-64">
        <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t("playlists.search-placeholder")}
          className="border-gray-700 bg-gray-800 pl-8 text-white selection:bg-pink-500 focus:border-pink-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
