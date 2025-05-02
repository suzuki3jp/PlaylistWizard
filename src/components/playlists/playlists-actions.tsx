"use client";
import { Search, Shuffle } from "lucide-react";

import type { WithT } from "@/@types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "./copy-button";
import { DeleteButton } from "./delete-button";
import { MergeButton } from "./merge-button";
import type { PlaylistState, TaskFunctions } from "./playlists-root";

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
    const selectedPlaylists = playlists.filter(
        (playlist) => playlist.isSelected,
    );

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
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    disabled={selectedPlaylists.length === 0}
                >
                    <Shuffle className="mr-2 h-4 w-4" />
                    {t("playlists.shuffle")}
                </Button>
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
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    disabled={selectedPlaylists.length === 0}
                >
                    <Search className="mr-2 h-4 w-4" />
                    {t("playlists.browse")}
                </Button>
            </div>

            <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    placeholder={t("playlists.search-placeholder")}
                    className="pl-8 bg-gray-800 border-gray-700 text-white focus:border-pink-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
    );
}
