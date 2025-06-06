"use client";
import { Trash as DeleteIcon } from "lucide-react";
import { useState } from "react";

import { sleep } from "@/common/sleep";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/shadcn/dialog";
import { DeletePlaylistUsecase } from "@/usecase/delete-playlist";
import { usePlaylists, useTask } from "../contexts";
import type { PlaylistOperationProps } from "./index";

export function DeleteButton({ t, refreshPlaylists }: PlaylistOperationProps) {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { playlists } = usePlaylists();
  const {
    dispatchers: {
      createTask,
      updateTaskMessage,
      updateTaskProgress,
      updateTaskStatus,
      removeTask,
    },
  } = useTask();

  if (!playlists) return null;

  const selectedPlaylists = playlists.filter((p) => p.isSelected);

  if (!auth) return null;

  const handleDelete = async () => {
    setIsOpen(false);
    const deleteTasks = selectedPlaylists.map(async (ps) => {
      const playlist = ps.data;
      const result = await new DeletePlaylistUsecase({
        playlistId: playlist.id,
        accessToken: auth.accessToken,
        repository: auth.provider,
      }).execute();

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
          className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-red-400"
          disabled={selectedPlaylists.length === 0}
        >
          <DeleteIcon className="mr-2 h-4 w-4" />
          {t("playlists.delete")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
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

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            onClick={() => setIsOpen(false)}
            className="bg-pink-600 text-white hover:bg-pink-700"
          >
            {t("action-modal.common.cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          >
            {t("action-modal.common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
