"use client";
import { Import } from "lucide-react";
import { useState } from "react";

import type { UUID } from "@/actions/generateUUID";
import { PlaylistManager } from "@/actions/playlist-manager";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { providerToAdapterType } from "@/helpers/providerToAdapterType";
import { sleep } from "@/helpers/sleep";
import { useAuth } from "@/hooks/useAuth";
import { SpotifySpecifierValidator } from "@/lib/validator/spotify-specifier";
import { YouTubePlaylistSpecifierValidator } from "@/lib/validator/youtube-specifier";
import type { PlaylistActionProps } from "./playlists-actions";

interface ImportPlaylistCardProps
    extends Omit<PlaylistActionProps, "playlists" | "refreshPlaylists"> {}

export function ImportPlaylistCard({
    t,
    createTask,
    updateTaskMessage,
    updateTaskProgress,
    updateTaskStatus,
    removeTask,
}: ImportPlaylistCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [playlistSpecifier, setPlaylistSpecifier] = useState("");
    const auth = useAuth();
    if (!auth) return null;

    const handleImport = async () => {
        setIsOpen(false);

        const manager = new PlaylistManager(
            auth.accessToken,
            providerToAdapterType(auth.provider),
        );

        let taskId: UUID | null = null;
        console.log(auth.provider);
        const isSameService =
            auth.provider === "google"
                ? YouTubePlaylistSpecifierValidator.isValid(playlistSpecifier)
                : SpotifySpecifierValidator.isValid(playlistSpecifier);

        if (!isSameService) {
            taskId = await createTask(
                "import",
                t("task-progress.import.different-service"),
            );
            updateTaskStatus(taskId, "error");
            await sleep(2000);
            removeTask(taskId);
            return;
        }

        const playlistId =
            auth.provider === "google"
                ? YouTubePlaylistSpecifierValidator.unique(playlistSpecifier)
                : SpotifySpecifierValidator.unique(playlistSpecifier);

        const playlist = await manager.getFullPlaylist(playlistId);
        if (playlist.isErr()) {
            if (taskId) {
                updateTaskMessage(
                    taskId,
                    t("task-progress.import.failed", {
                        title: "UNKNOWN",
                        code: playlist.error.status,
                    }),
                );
            } else {
                taskId = await createTask(
                    "import",
                    t("task-progress.import.failed", {
                        title: "UNKNOWN",
                        code: playlist.error.status,
                    }),
                );
            }
            updateTaskStatus(taskId, "error");
            await sleep(2000);
            removeTask(taskId);
            return;
        }

        if (taskId) {
            updateTaskMessage(
                taskId,
                t("task-progress.import.processing", {
                    title: playlist.value.title,
                }),
            );
        } else {
            taskId = await createTask(
                "import",
                t("task-progress.import.processing", {
                    title: playlist.value.title,
                }),
            );
        }

        const result = await manager.import({
            sourceId: playlistId,
            allowDuplicates: true,
            onAddedPlaylist: (p) => {
                updateTaskMessage(
                    taskId,
                    t("task-progress.created-playlist", {
                        title: p.title,
                    }),
                );
            },
            onAddingPlaylistItem: (i) => {
                updateTaskMessage(
                    taskId,
                    t("task-progress.copying-playlist-item", {
                        title: i.title,
                    }),
                );
            },
            onAddedPlaylistItem: (i, c, total) => {
                updateTaskMessage(
                    taskId,
                    t("task-progress.copied-playlist-item", {
                        title: i.title,
                    }),
                );
                updateTaskProgress(taskId, (c / total) * 100);
            },
        });

        const message = result.isOk()
            ? t("task-progress.import.succeed", {
                  title: playlist.value.title,
              })
            : t("task-progress.import.failed", {
                  title: playlist.value.title,
                  code: result.error.status,
              });
        if (result.isOk()) {
            updateTaskStatus(taskId, "completed");
            updateTaskProgress(taskId, 100);
        } else {
            updateTaskStatus(taskId, "error");
        }
        updateTaskMessage(taskId, message);
        await sleep(2000);
        removeTask(taskId);
    };

    function shouldDisableImport() {
        if (!playlistSpecifier) return true;
        if (
            !SpotifySpecifierValidator.isValid(playlistSpecifier) &&
            !YouTubePlaylistSpecifierValidator.isValid(playlistSpecifier)
        )
            return true;
        return false;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-800/30 p-6 text-center hover:bg-gray-800/50 transition-colors cursor-pointer h-full min-h-[200px]">
                    <div className="rounded-full bg-gray-800 p-3 mb-3">
                        <Import className="h-6 w-6 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white">
                        {t("action-modal.import.title")}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                        {t("action-modal.import.subtitle")}
                    </p>
                </div>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-gray-800 text-white sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-pink-600 p-1.5">
                            <Import className="h-4 w-4 text-white" />
                        </div>
                        <DialogTitle className="text-xl">
                            {t("action-modal.import.title")}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400">
                        {t("action-modal.import.description")}
                    </DialogDescription>
                </DialogHeader>

                <div>
                    <Input
                        placeholder={t("action-modal.import.placeholder")}
                        value={playlistSpecifier}
                        onChange={(e) => setPlaylistSpecifier(e.target.value)}
                        className="selection:bg-pink-500"
                    />
                    {playlistSpecifier && shouldDisableImport() && (
                        <div className="text-sm text-destructive mt-2">
                            {t("action-modal.import.invalid-specify")}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex sm:justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    >
                        {t("action-modal.common.cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleImport}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                        disabled={shouldDisableImport()}
                    >
                        {t("action-modal.common.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
