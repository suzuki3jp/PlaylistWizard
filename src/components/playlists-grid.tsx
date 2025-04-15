"use client";
import { FileDownloadSharp as ImportPlaylistIcon } from "@mui/icons-material";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { SnackbarProvider } from "notistack";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

import { type Playlist, PlaylistManager, type UUID } from "@/actions";
import { PlaylistActions } from "@/components/playlist-actions";
import { Button } from "@/components/shadcn-ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/shadcn-ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/shadcn-ui/dialog";
import { Input } from "@/components/shadcn-ui/input";
import { Progress } from "@/components/shadcn-ui/progress";
import { useT } from "@/hooks";

/**
 * The PlaylistGrid component in the YourPlaylists section.
 * It will display the selectable user playlists.
 * If some playlists are selected, it will display the action buttons to perform.
 * @returns
 */
export const PlaylistsGrid = () => {
    const { t } = useT();
    const [playlists, setPlaylists] = useState<PlaylistState[]>([]);
    const [tasks, setTasks] = useState<Map<UUID, Task>>(new Map());
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importUrl, setImportUrl] = useState("");
    const { data } = useSession();

    /**
     * Refresh the playlists state.
     * It will reset the playlists selected state to false.
     */
    const refreshPlaylists = useCallback(async () => {
        if (!data?.accessToken) return;
        const playlists = await new PlaylistManager(
            data.accessToken,
        ).getPlaylists();

        if (playlists.isOk()) {
            setPlaylists(
                playlists.data.map<PlaylistState>((playlist) => ({
                    data: playlist,
                    isSelected: false,
                })),
            );
        } else if (playlists.data.status === 404) {
            setPlaylists([]);
        } else {
            signOut();
        }
    }, [data]);

    const setTask = (
        taskId: UUID,
        callback: (prev: Task | undefined) => Task | null,
    ) => {
        setTasks((prev) => {
            const prevData = prev.get(taskId);
            const callbackResult = callback(prevData);
            const newMap = new Map(prev);
            callbackResult
                ? newMap.set(taskId, callbackResult)
                : newMap.delete(taskId);
            return newMap;
        });
    };

    const updateTask: UpdateTaskFunc = ({
        taskId,
        message,
        completed,
        total,
    }) => {
        if (message || completed || total) {
            setTask(taskId, (prev) => {
                if (prev) {
                    return {
                        message: message ?? prev.message,
                        progress:
                            completed && total
                                ? (completed / total) * 100
                                : prev.progress,
                    };
                }

                return {
                    message: message ?? "DEFAULT MESSAGE",
                    progress: 0,
                };
            });
        } else {
            setTask(taskId, () => null);
        }
    };

    useEffect(() => {
        refreshPlaylists();
    }, [refreshPlaylists]);

    function importPlaylist() {
        alert("It's not implemented yet.");
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {Array.from(tasks.entries()).map(([taskId, data]) => (
                    <Card key={taskId}>
                        <CardHeader>
                            <CardTitle>{data.message}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Progress value={data.progress} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/**
             * The action buttons to perform when some playlists are selected.
             */}
            <SnackbarProvider>
                {playlists.some((playlist) => playlist.isSelected) && (
                    <PlaylistActions
                        refreshPlaylists={refreshPlaylists}
                        playlists={playlists}
                        updateTask={updateTask}
                    />
                )}
            </SnackbarProvider>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/**
                 * The playlists grid.
                 */}
                {playlists.map((playlist) => (
                    <Card
                        key={playlist.data.id}
                        onClick={() => toggleSelected(playlist, setPlaylists)}
                        className={`cursor-pointer ${
                            playlist.isSelected
                                ? "border-2 border-blue-500"
                                : ""
                        }`}
                    >
                        <CardHeader>
                            <CardTitle className="text-base">
                                {playlist.data.title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {t("your-playlists.videos-count", {
                                    count: playlist.data.itemsTotal,
                                })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full pb-[56.25%]">
                                <Image
                                    src={playlist.data.thumbnail}
                                    alt={`${playlist.data.title}'s thumbnail`}
                                    layout="fill"
                                    objectFit="cover"
                                    className="absolute inset-0 w-full h-full object-cover"
                                    draggable={false}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <Card
                    className="cursor-pointer hover:bg-secondary/50 flex flex-col justify-center items-center min-h-[200px]"
                    onClick={() => setIsImportOpen((prev) => !prev)}
                >
                    <CardContent className="flex flex-col items-center space-y-4 pt-6">
                        <div className="rounded-full bg-secondary p-3">
                            <ImportPlaylistIcon />
                        </div>
                        <CardTitle className="text-base">
                            {t("your-playlists.actions.import")}
                        </CardTitle>
                    </CardContent>
                </Card>
                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {t("your-playlists.action-modal.import.title")}
                            </DialogTitle>
                        </DialogHeader>
                        <Input
                            placeholder={t(
                                "your-playlists.action-modal.import.enter-url",
                            )}
                        />
                        <DialogFooter>
                            <DialogClose>
                                <Button variant="secondary">
                                    {t("your-playlists.action-modal.cancel")}
                                </Button>
                            </DialogClose>
                            <Button type="submit" onClick={importPlaylist}>
                                {t("your-playlists.action-modal.confirm")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

type Task = {
    message: string;
    progress: number;
};

export type UpdateTaskFunc = (options: {
    taskId: UUID;
    message?: string;
    completed?: number;
    total?: number;
}) => void;

export interface PlaylistState {
    data: Playlist;
    isSelected: boolean;
}

/**
 * Toggle the selected state in the playlists state.
 * @param playlist
 */
const toggleSelected = (
    playlist: PlaylistState,
    setState: React.Dispatch<React.SetStateAction<PlaylistState[]>>,
) => {
    setState((prev) =>
        prev.map((p) =>
            p.data.id === playlist.data.id
                ? { ...p, isSelected: !playlist.isSelected }
                : p,
        ),
    );
};
