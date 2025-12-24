"use client";

import type { WithT } from "i18next";
import { Plus as CreateIcon, HelpCircle } from "lucide-react";
import { useState } from "react";
import { sleep } from "@/common/sleep";
import { Tooltip } from "@/presentation/common/tooltip";
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
import { Input } from "@/presentation/shadcn/input";
import { JobsBuilder } from "@/usecase/command/jobs";
import { CreatePlaylistJob } from "@/usecase/command/jobs/create-playlist";
import { useHistory } from "../contexts/history";
import { useTask } from "../contexts/tasks";
import { createPlaylist } from "../create-playlist";
import { PlaylistPrivacy } from "../entities";
import { useRefreshPlaylists } from "../hooks/use-refresh-playlists";
import { useInvalidatePlaylistsQuery } from "../queries/use-playlists";
import { PlaylistActionButton } from "./playlist-action-button";
import { TaskStatus, TaskType } from "./tasks-monitor";

export function PlaylistCreateActionButton({ t }: WithT) {
  const history = useHistory();
  const auth = useAuth();
  const {
    dispatchers: {
      createTask,
      updateTaskProgress,
      updateTaskStatus,
      updateTaskMessage,
      removeTask,
    },
  } = useTask();
  const refreshPlaylist = useRefreshPlaylists();
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();

  const [isOpen, setIsOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState(
    t("action-modal.create.new-playlist-name.placeholder"),
  );

  async function handleCreate() {
    if (!auth) return;
    setIsOpen(false);

    const jobs = new JobsBuilder();

    const taskId = await createTask(
      TaskType.Create,
      t("task-progress.creating-new-playlist"),
    );
    const result = await createPlaylist({
      title: newPlaylistName,
      accessToken: auth.accessToken,
      repository: auth.provider,
    });

    const message = result.isOk()
      ? t("task-progress.succeed-to-create-playlist", {
          title: newPlaylistName,
        })
      : t("task-progress.failed-to-create-playlist", {
          title: newPlaylistName,
          code: result.error.status,
        });

    if (result.isOk()) {
      jobs.addJob(
        new CreatePlaylistJob({
          accessToken: auth.accessToken,
          provider: auth.provider,
          id: result.value.id,
          title: result.value.title,
          privacy: PlaylistPrivacy.Unlisted,
        }),
      );

      updateTaskProgress(taskId, 100);
      updateTaskStatus(taskId, TaskStatus.Completed);
      updateTaskMessage(taskId, message);
    } else {
      updateTaskStatus(taskId, TaskStatus.Error);
      updateTaskMessage(taskId, message);
    }

    history.addCommand(jobs.toCommand());

    await sleep(2000);
    removeTask(taskId);

    refreshPlaylist();
    invalidatePlaylistsQuery(); // Migrating to tanstack query from context-based cache
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PlaylistActionButton>
          <CreateIcon />
          {t("playlists.create")}
        </PlaylistActionButton>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-pink-600 p-1.5">
              <CreateIcon className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl">
              {t("action-modal.create.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {t("action-modal.create.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: TODO */}
            <label className="font-medium text-sm text-white">
              {t("action-modal.create.new-playlist-name.title")}
            </label>
            <Tooltip
              description={t(
                "action-modal.create.new-playlist-name.description",
              )}
              className="border-gray-700 bg-gray-800 text-white"
            >
              <Button
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">{t("action-modal.common.help")}</span>
              </Button>
            </Tooltip>
          </div>
          <Input
            placeholder={t("action-modal.create.new-playlist-name.placeholder")}
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="selection:bg-pink-500"
          />
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            onClick={() => setIsOpen(false)}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          >
            {t("action-modal.common.cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCreate}
            className="bg-pink-600 text-white hover:bg-pink-700 hover:text-white"
          >
            {t("action-modal.common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
