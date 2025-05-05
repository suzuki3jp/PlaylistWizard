"use client";
import { Trash as DeleteIcon } from "lucide-react";
import { useState } from "react";

import { PlaylistManager } from "@/actions/playlist-manager";
import type { PlaylistActionProps } from "@/components/playlists/playlists-actions";
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
import { providerToAdapterType } from "@/helpers/providerToAdapterType";
import { sleep } from "@/helpers/sleep";
import { useAuth } from "@/hooks/useAuth";

export function DeleteButton({
    t,
    playlists,
    refreshPlaylists,
    createTask,
    updateTaskMessage,
    updateTaskProgress,
    updateTaskStatus,
    removeTask,
}: PlaylistActionProps) {
    const auth = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!auth) return null;

    const handleDelete = async () => {
        setIsOpen(false);
        const manager = new PlaylistManager(
            auth.accessToken,
            providerToAdapterType(auth.provider),
        );

        const deleteTasks = playlists
            .filter((ps) => ps.isSelected)
            .map(async (ps) => {
                const playlist = ps.data;
                const result = await manager.delete(playlist.id);

                const taskId = await createTask(
                    "delete",
                    t("task-progress.delete.processing"),
                );

                const message = result.isOk()
                    ? t("task-progress.delete.success", {
                          title: playlist.title,
                      })
                    : t("task-progress.delete.failed", {
                          title: playlist.title,
                          code: result.error.status,
                      });
                updateTaskProgress(taskId, 100);
                updateTaskMessage(taskId, message);
                updateTaskStatus(taskId, result.isOk() ? "completed" : "error");

                await sleep(2000);
                removeTask(taskId);
            });

        await Promise.all(deleteTasks);
        refreshPlaylists();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-red-400"
                    disabled={
                        playlists.filter((p) => p.isSelected).length === 0
                    }
                >
                    <DeleteIcon className="mr-2 h-4 w-4" />
                    {t("playlists.delete")}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-gray-800 text-white sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-pink-600 p-1.5">
                            <DeleteIcon className="h-4 w-4 text-white" />
                        </div>
                        <DialogTitle className="text-xl">
                            {t("action-modal.delete.title")}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400">
                        {t("action-modal.delete.description")}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex sm:justify-end gap-2">
                    <Button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                        {t("action-modal.common.cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDelete}
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    >
                        {t("action-modal.common.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
