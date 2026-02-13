"use client";
import type { TFunction } from "i18next";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { ga4Events } from "@/constants";
import { useAuth } from "@/presentation/hooks/useAuth";
import { JobsBuilder } from "@/usecase/command/jobs";
import { RemovePlaylistItemJob } from "@/usecase/command/jobs/remove-playlist-item";
import { DeduplicatePlaylistUsecase } from "@/usecase/deduplicate-playlist";
import { useHistory } from "../../contexts/history";
import { useSelectedPlaylists } from "../../contexts/selected-playlists";
import { useTask } from "../../contexts/tasks";
import {
  useInvalidatePlaylistsQuery,
  usePlaylistsQuery,
} from "../../queries/use-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import { TaskStatus, TaskType } from "../tasks-monitor";
import type { PlaylistActionComponentProps } from "./types";

function useDeduplicateAction(t: TFunction) {
  const history = useHistory();
  const auth = useAuth();
  const { data: playlists } = usePlaylistsQuery();
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

  return async () => {
    if (!auth) return;
    const deduplicateTasks = selectedPlaylists.map(async (ps) => {
      // biome-ignore lint/style/noNonNullAssertion: selectedPlaylists are from existing playlists
      const playlist = playlists!.find((p) => p.id === ps)!;
      const taskId = await createTask(
        TaskType.Deduplicate,
        t("task-progress.deduplicate.processing", {
          title: playlist.title,
        }),
      );

      emitGa4Event(ga4Events.deduplicatePlaylist);

      const jobs = new JobsBuilder();

      const result = await new DeduplicatePlaylistUsecase({
        accessToken: auth.accessToken,
        repository: auth.provider,
        targetPlaylistId: playlist.id,
        onRemovingPlaylistItem: (item) => {
          updateTaskMessage(
            taskId,
            t("task-progress.deduplicate.removing", {
              title: item.title,
            }),
          );
        },
        onRemovedPlaylistItem: (item, currentIndex, totalLength) => {
          updateTaskMessage(
            taskId,
            t("task-progress.deduplicate.removed", {
              title: item.title,
            }),
          );
          updateTaskProgress(taskId, ((currentIndex + 1) / totalLength) * 100);
          jobs.addJob(
            new RemovePlaylistItemJob({
              accessToken: auth.accessToken,
              provider: auth.provider,
              playlistId: playlist.id,
              resourceId: item.videoId,
            }),
          );
        },
      }).execute();

      if (result.isOk()) {
        const duplicates = result.value;
        if (duplicates.length === 0) {
          updateTaskMessage(
            taskId,
            t("task-progress.deduplicate.no-duplicates", {
              title: playlist.title,
            }),
          );
        } else {
          updateTaskMessage(
            taskId,
            t("task-progress.deduplicate.succeed", {
              title: playlist.title,
            }),
          );
        }
        updateTaskStatus(taskId, TaskStatus.Completed);
        updateTaskProgress(taskId, 100);
      } else {
        updateTaskMessage(
          taskId,
          t("task-progress.deduplicate.failed", {
            title: playlist.title,
            code: result.error.status,
          }),
        );
        updateTaskStatus(taskId, TaskStatus.Error);
      }

      history.addCommand(jobs.toCommand());

      await sleep(2000);
      removeTask(taskId);
    });

    await Promise.all(deduplicateTasks);
    invalidatePlaylistsQuery();
  };
}

export function DeduplicateAction({
  t,
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const handleDeduplicate = useDeduplicateAction(t);

  return (
    <PlaylistActionButton disabled={disabled} onClick={handleDeduplicate}>
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </PlaylistActionButton>
  );
}
