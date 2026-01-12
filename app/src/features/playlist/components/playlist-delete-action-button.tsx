"use client";
import type { WithT } from "i18next";
import { Trash as DeleteIcon } from "lucide-react";
import { useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
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
import { ga4Events } from "@/constants";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Command } from "@/usecase/command/command";
import { JobsBuilder } from "@/usecase/command/jobs";
import { RemovePlaylistJob } from "@/usecase/command/jobs/remove-playlist";
import { RemovePlaylistItemJob } from "@/usecase/command/jobs/remove-playlist-item";
import { DeletePlaylistUsecase } from "@/usecase/delete-playlist";
import { FetchFullPlaylistUsecase } from "@/usecase/fetch-full-playlist";
import { useHistory } from "../contexts/history";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { useTask } from "../contexts/tasks";
import {
  useInvalidatePlaylistsQuery,
  usePlaylistsQuery,
} from "../queries/use-playlists";
import { PlaylistActionButton } from "./playlist-action-button";
import { TaskStatus, TaskType } from "./tasks-monitor";

export function DeleteButton({ t }: WithT) {
  const history = useHistory();
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { data: playlists, isPending } = usePlaylistsQuery();
  const {
    dispatchers: {
      createTask,
      updateTaskMessage,
      updateTaskProgress,
      updateTaskStatus,
      removeTask,
    },
  } = useTask();
  const { selectedPlaylists } = useSelectedPlaylists();
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();

  if (isPending) return null;

  const handleDelete = async () => {
    if (!auth) return;
    setIsOpen(false);

    emitGa4Event(ga4Events.deletePlaylist);

    const deleteTasks = selectedPlaylists.map(async (ps) => {
      // biome-ignore lint/style/noNonNullAssertion: selectedPlaylists are from existing playlists
      const playlist = playlists.find((p) => p.id === ps)!;
      const fullplaylist = await new FetchFullPlaylistUsecase({
        playlistId: playlist.id,
        accessToken: auth.accessToken,
        repository: auth.provider,
      }).execute();
      if (fullplaylist.isErr()) return;

      // Build jobs for un-doing the delete operation.
      const jobs = new JobsBuilder();
      for (const item of fullplaylist.value.items) {
        jobs.addJob(
          new RemovePlaylistItemJob({
            accessToken: auth.accessToken,
            provider: auth.provider,
            playlistId: playlist.id,
            resourceId: item.videoId,
          }),
        );
      }
      const job = new RemovePlaylistJob({
        accessToken: auth.accessToken,
        provider: auth.provider,
        title: fullplaylist.value.title,
        jobs: jobs.toJSON(),
      });

      const result = await new DeletePlaylistUsecase({
        playlistId: playlist.id,
        accessToken: auth.accessToken,
        repository: auth.provider,
      }).execute();

      const taskId = await createTask(
        TaskType.Delete,
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
      updateTaskStatus(
        taskId,
        result.isOk() ? TaskStatus.Completed : TaskStatus.Error,
      );

      if (result.isOk()) history.addCommand(new Command([job]));

      await sleep(2000);
      removeTask(taskId);
    });

    await Promise.all(deleteTasks);
    invalidatePlaylistsQuery();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PlaylistActionButton
          className="hover:text-red-400"
          disabled={selectedPlaylists.length === 0}
        >
          <DeleteIcon className="mr-2 h-4 w-4" />
          {t("playlists.delete")}
        </PlaylistActionButton>
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
