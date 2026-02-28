"use client";
import type { TFunction } from "i18next";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { ga4Events } from "@/constants";
import { Provider } from "@/entities/provider";
import { useFocusedAccount } from "@/features/accounts";
import { useSession } from "@/lib/auth-client";
import { JobsBuilder } from "@/usecase/command/jobs";
import { UpdatePlaylistItemPositionJob } from "@/usecase/command/jobs/update-playlist-item-position";
import { ShufflePlaylistUsecase } from "@/usecase/shuffle-playlist";
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

function useShuffleAction(t: TFunction) {
  const history = useHistory();
  const { data: session } = useSession();
  const [focusedAccount] = useFocusedAccount();
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
    if (!session || !focusedAccount) return;
    const shuffleTasks = selectedPlaylists.map(async (ps) => {
      // biome-ignore lint/style/noNonNullAssertion: selectedPlaylists are from existing playlists
      const playlist = playlists!.find((p) => p.id === ps)!;
      const taskId = await createTask(
        TaskType.Shuffle,
        t("task-progress.shuffle.processing", {
          title: playlist.title,
        }),
      );

      emitGa4Event(ga4Events.shufflePlaylist);

      const jobs = new JobsBuilder();

      const result = await new ShufflePlaylistUsecase({
        repository: Provider.GOOGLE,
        targetPlaylistId: playlist.id,
        ratio: 0.4,
        accId: focusedAccount.id,
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
              provider: Provider.GOOGLE,
              playlistId: playlist.id,
              itemId: i.id,
              resourceId: i.videoId,
              from: oldI,
              accId: focusedAccount.id,
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
}

export function ShuffleAction({
  t,
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const handleShuffle = useShuffleAction(t);

  return (
    <PlaylistActionButton disabled={disabled} onClick={handleShuffle}>
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </PlaylistActionButton>
  );
}
