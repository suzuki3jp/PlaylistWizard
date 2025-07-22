"use client";
import { Shuffle as ShuffleIcon } from "lucide-react";

import { sleep } from "@/common/sleep";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/shadcn/button";
import { JobsBuilder } from "@/usecase/command/jobs";
import { UpdatePlaylistItemPositionJob } from "@/usecase/command/jobs/update-playlist-item-position";
import { ShufflePlaylistUsecase } from "@/usecase/shuffle-playlist";
import { usePlaylists, useTask } from "../contexts";
import { useHistory } from "../history";
import type { PlaylistOperationProps } from "./index";

export function ShuffleButton({ t, refreshPlaylists }: PlaylistOperationProps) {
  const history = useHistory();
  const auth = useAuth();
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

  if (!auth) return null;

  if (!playlists) return null;

  const selectedPlaylists = playlists.filter((p) => p.isSelected);

  const handleShuffle = async () => {
    const shuffleTasks = selectedPlaylists.map(async (ps) => {
      const playlist = ps.data;
      const taskId = await createTask(
        "shuffle",
        t("task-progress.shuffle.processing", {
          title: playlist.title,
        }),
      );

      const jobs = new JobsBuilder();

      const result = await new ShufflePlaylistUsecase({
        accessToken: auth.accessToken,
        repository: auth.provider,
        targetPlaylistId: playlist.id,
        ratio: 0.4,
        onUpdatingPlaylistItemPosition: (i, oldI, newI) => {
          updateTaskMessage(
            taskId,
            t("task-progress.shuffle.moving", {
              title: i.title,
              old: oldI,
              new: newI,
            }),
          );
        },
        onUpdatedPlaylistItemPosition: (i, oldI, newI, c, total) => {
          updateTaskMessage(
            taskId,
            t("task-progress.shuffle.moved", {
              title: i.title,
              old: oldI,
              new: newI,
            }),
          );
          updateTaskProgress(taskId, (c / total) * 100);
          jobs.addJob(
            new UpdatePlaylistItemPositionJob({
              accessToken: auth.accessToken,
              provider: auth.provider,
              playlistId: playlist.id,
              itemId: i.id,
              resourceId: i.videoId,
              from: oldI,
            }),
          );
        },
      }).execute();

      const message = result.isOk()
        ? t("task-progress.shuffle.succeed", {
            title: playlist.title,
          })
        : t("task-progress.shuffle.failed", {
            title: playlist.title,
            code: result.error.status,
          });

      if (result.isOk()) {
        updateTaskStatus(taskId, "completed");
        updateTaskProgress(taskId, 100);
      } else {
        updateTaskStatus(taskId, "error");
      }
      updateTaskMessage(taskId, message);

      history.addCommand(jobs.toCommand());

      await sleep(2000);
      removeTask(taskId);
    });

    await Promise.all(shuffleTasks);
    refreshPlaylists();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
      disabled={selectedPlaylists.length === 0}
      onClick={handleShuffle}
    >
      <ShuffleIcon className="mr-2 h-4 w-4" />
      {t("playlists.shuffle")}
    </Button>
  );
}
