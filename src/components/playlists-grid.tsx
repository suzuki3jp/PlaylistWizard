"use client";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { SnackbarProvider } from "notistack";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

import { type Playlist, PlaylistManager, type UUID } from "@/actions";
import { PlaylistActions } from "@/components/playlist-actions";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/shadcn-ui/card";
import { Progress } from "@/components/shadcn-ui/progress";
import { Text } from "@/components/ui/text";
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
    const [isNotFound, setIsNotFound] = useState(false);
    const [tasks, setTasks] = useState<Map<UUID, Task>>(new Map());
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

        if (playlists.isSuccess()) {
            setPlaylists(
                playlists.data.map<PlaylistState>((playlist) => ({
                    data: playlist,
                    isSelected: false,
                })),
            );
        } else if (playlists.data.status === 404) {
            setPlaylists([]);
            setIsNotFound(true);
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

    return isNotFound ? (
        <Text>{t("your-playlists.not-found")}</Text>
    ) : (
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
                            <CardTitle className="text-2xl">
                                {playlist.data.title}
                            </CardTitle>
                            <CardDescription>
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
