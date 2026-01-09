"use client";
import type { WithT } from "i18next";
import { Shuffle as ShuffleIcon } from "lucide-react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { ga4Events } from "@/constants";
import { useAuth } from "@/presentation/hooks/useAuth";
import { JobsBuilder } from "@/usecase/command/jobs";
import { UpdatePlaylistItemPositionJob } from "@/usecase/command/jobs/update-playlist-item-position";
import { ShufflePlaylistUsecase } from "@/usecase/shuffle-playlist";
import { useHistory } from "../contexts/history";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { useTask } from "../contexts/tasks";
import {
  useInvalidatePlaylistsQuery,
  usePlaylistsQuery,
} from "../queries/use-playlists";
import { PlaylistActionButton } from "./playlist-action-button";
import { TaskStatus, TaskType } from "./tasks-monitor";

export function ShuffleButton({ t }: WithT) {
  const history = useHistory();
  const auth = useAuth();
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
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();
  const { selectedPlaylists } = useSelectedPlaylists();

  if (isPending) return null;

  const handleShuffle = async () => {
    if (!auth) return;
    const shuffleTasks = selectedPlaylists.map(async (ps) => {
      // biome-ignore lint/style/noNonNullAssertion: selectedPlaylists are from existing playlists
      const playlist = playlists.find((p) => p.id === ps)!;
      const taskId = await createTask(
        TaskType.Shuffle,
        t("task-progress.shuffle.processing", {
          title: playlist.title,
        }),
      );

      emitGa4Event(ga4Events.shufflePlaylist);

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
        updateTaskStatus(taskId, TaskStatus.Completed);
        updateTaskProgress(taskId, 100);
      } else {
        updateTaskStatus(taskId, TaskStatus.Error);
      }
      updateTaskMessage(taskId, message);

      history.addCommand(jobs.toCommand());

      await sleep(2000);
      removeTask(taskId);
    });

    await Promise.all(shuffleTasks);
    invalidatePlaylistsQuery();
  };

  return (
    <PlaylistActionButton
      disabled={selectedPlaylists.length === 0}
      onClick={handleShuffle}
    >
      <ShuffleIcon className="mr-2 h-4 w-4" />
      {t("playlists.shuffle")}
    </PlaylistActionButton>
  );
}
