"use client";
import { FileDownloadSharp as ImportPlaylistIcon } from "@mui/icons-material";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

import {
    type Playlist,
    PlaylistManager,
    type UUID,
    generateUUID,
} from "@/actions";
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

export const YouTubePlaylistIdPattern = /^PL[a-zA-Z0-9_-]{32}$/;
export const YouTubePlaylistUrlPattern =
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:playlist\?list=|watch\?.*?&list=)[a-zA-Z0-9_-]+(?:&.*)?$/;

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
    const [playlistSpecifier, setPlaylistSpecifier] = useState("");
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

    function isValidPlaylistSpecifier(specifier: string) {
        return (
            YouTubePlaylistIdPattern.test(specifier) ||
            YouTubePlaylistUrlPattern.test(specifier)
        );
    }

    async function onImportSubmit() {
        setIsImportOpen(false);
        if (!data?.accessToken) return;

        function extractId(specifier: string) {
            if (YouTubePlaylistIdPattern.test(specifier)) {
                return specifier;
            }
            if (YouTubePlaylistUrlPattern.test(specifier)) {
                const url = new URL(specifier);
                const id = url.searchParams.get("list");
                if (id) {
                    return id;
                }
            }
            throw new Error("Invalid playlist specifier. This is a bug.");
        }
        const manager = new PlaylistManager(data.accessToken);
        const playlistId = extractId(playlistSpecifier);

        const playlist = await manager.getFullPlaylist(playlistId);
        if (playlist.isErr()) {
            enqueueSnackbar(
                t("task-progress.failed-to-import-playlist", {
                    title: "UNKNOWN",
                    code: playlist.data.status,
                }),
            );
            return;
        }

        const taskId = await generateUUID();
        updateTask({
            taskId,
            message: t("task-progress.importing-playlist", {
                title: playlist.data.title,
            }),
        });
        const result = await manager.import({
            sourceId: playlistId,
            allowDuplicates: true,
            onAddedPlaylist: (p) => {
                updateTask({
                    taskId,
                    message: t("task-progress.created-playlist", {
                        title: p.title,
                    }),
                });
            },
            onAddingPlaylistItem: (i) => {
                updateTask({
                    taskId,
                    message: t("task-progress.copying-playlist-item", {
                        title: i.title,
                    }),
                });
            },
            onAddedPlaylistItem: (i, c, total) => {
                updateTask({
                    taskId,
                    message: t("task-progress.copied-playlist-item", {
                        title: i.title,
                    }),
                    completed: c,
                    total,
                });
            },
        });

        updateTask({
            taskId,
        });
        const message = result.isOk()
            ? t("task-progress.succeed-to-import-playlist", {
                  title: playlist.data.title,
              })
            : t("task-progress.failed-to-import-playlist", {
                  title: playlist.data.title,
                  code: result.data.status,
              });
        enqueueSnackbar(message, {
            variant: result.isOk() ? "success" : "error",
        });
        refreshPlaylists();
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
                        <div>
                            <Input
                                placeholder={t(
                                    "your-playlists.action-modal.import.enter-url",
                                )}
                                value={playlistSpecifier}
                                onChange={(e) =>
                                    setPlaylistSpecifier(e.target.value)
                                }
                            />
                            {playlistSpecifier &&
                                !isValidPlaylistSpecifier(
                                    playlistSpecifier,
                                ) && (
                                    <div className="text-sm text-destructive mt-2">
                                        {t(
                                            "your-playlists.action-modal.import.invalid-url",
                                        )}
                                    </div>
                                )}
                        </div>
                        <DialogFooter className="mt-4">
                            <DialogClose>
                                <Button variant="secondary">
                                    {t("your-playlists.action-modal.cancel")}
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                onClick={onImportSubmit}
                                disabled={
                                    !isValidPlaylistSpecifier(playlistSpecifier)
                                }
                            >
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
