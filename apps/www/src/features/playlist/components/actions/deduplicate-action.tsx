"use client";
import type { TFunction } from "i18next";
import { enqueueSnackbar } from "notistack";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { ga4Events } from "@/constants";
import { Provider } from "@/entities/provider";
import { useSession } from "@/lib/auth-client";
import { FeatureFlagName } from "@/lib/feature-flags";
import type { EnqueueJobRequest } from "@/lib/schemas/jobs";
import { OperationType } from "@/lib/schemas/jobs";
import { useFeatureFlag } from "@/presentation/hooks/useFeatureFlag";
import { JobsBuilder } from "@/usecase/command/jobs";
import { RemovePlaylistItemJob } from "@/usecase/command/jobs/remove-playlist-item";
import { DeduplicatePlaylistUsecase } from "@/usecase/deduplicate-playlist";
import { useHistory } from "../../contexts/history";
import { useSelectedPlaylists } from "../../contexts/selected-playlists";
import { useServerJobs } from "../../contexts/server-jobs";
import { useTask } from "../../contexts/tasks";
import { useInvalidatePlaylistsQuery } from "../../queries/use-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import { TaskStatus, TaskType } from "../tasks-monitor";
import type { PlaylistActionComponentProps } from "./types";

function useDeduplicateAction(t: TFunction) {
  const history = useHistory();
  const { data: session } = useSession();
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
  const isServerSide = useFeatureFlag(
    FeatureFlagName.serverSidePlaylistActions,
  );
  const { addJob } = useServerJobs();

  return async () => {
    if (!session) return;

    if (isServerSide) {
      const deduplicateTasks = selectedPlaylists.map(async (playlist) => {
        const request: EnqueueJobRequest = {
          type: "deduplicate",
          accId: playlist.accountId,
          targetPlaylistId: playlist.id,
        };
        const res = await fetch("/api/v1/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        if (!res.ok) {
          enqueueSnackbar(
            t("task-progress.deduplicate.failed", {
              title: playlist.title,
              code: res.status,
            }),
            { variant: "error" },
          );
          return;
        }
        const { jobId } = (await res.json()) as { jobId: string };
        addJob({
          jobId,
          type: OperationType.Deduplicate,
          label: t("task-progress.deduplicate.processing", {
            title: playlist.title,
          }),
        });
      });
      await Promise.all(deduplicateTasks);
      return;
    }

    const deduplicateTasks = selectedPlaylists.map(async (playlist) => {
      const taskId = await createTask(
        TaskType.Deduplicate,
        t("task-progress.deduplicate.processing", {
          title: playlist.title,
        }),
      );

      emitGa4Event(ga4Events.deduplicatePlaylist);

      const jobs = new JobsBuilder();

      const result = await new DeduplicatePlaylistUsecase({
        repository: Provider.GOOGLE,
        targetPlaylistId: playlist.id,
        accId: playlist.accountId,
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
              provider: Provider.GOOGLE,
              playlistId: playlist.id,
              resourceId: item.videoId,
              accId: playlist.accountId,
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
