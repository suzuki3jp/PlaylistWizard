"use client";
import type { TFunction } from "i18next";
import { useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ga4Events } from "@/constants";
import type { PlaylistId } from "@/entities/ids";
import { Provider } from "@/entities/provider";
import { useFocusedAccount } from "@/features/accounts";
import { useSession } from "@/lib/auth-client";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { CreatePlaylistJob } from "@/usecase/command/jobs/create-playlist";
import { CopyPlaylistUsecase } from "@/usecase/copy-playlist";
import { useHistory } from "../../contexts/history";
import { useSelectedPlaylists } from "../../contexts/selected-playlists";
import { useTask } from "../../contexts/tasks";
import { PlaylistPrivacy } from "../../entities";
import {
  useInvalidatePlaylistsQuery,
  usePlaylistsQuery,
} from "../../queries/use-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import { TaskStatus, TaskType } from "../tasks-monitor";
import { ActionDialogFooter } from "./action-dialog-footer";
import { ActionDialogHeader } from "./action-dialog-header";
import { AllowDuplicatesCheckbox } from "./allow-duplicates-checkbox";
import { TargetPlaylistSelect } from "./target-playlist-select";
import type { PlaylistActionComponentProps } from "./types";

function useCopyAction(t: TFunction) {
  const history = useHistory();
  const { data: session } = useSession();
  const [focusedAccount] = useFocusedAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState<PlaylistId | null>(null);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const { data: playlists } = usePlaylistsQuery();
  const { selectedPlaylists } = useSelectedPlaylists();
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();
  const {
    dispatchers: {
      createTask,
      updateTaskMessage,
      updateTaskProgress,
      updateTaskStatus,
      removeTask,
    },
  } = useTask();

  const handleCopy = async () => {
    if (!session || !focusedAccount) return;
    setIsOpen(false);
    const isTargeted = targetId !== null;

    emitGa4Event(ga4Events.copyPlaylist);

    const copyTasks = selectedPlaylists.map(async (ps) => {
      const jobs = new JobsBuilder();
      // biome-ignore lint/style/noNonNullAssertion: selectedPlaylists are from existing playlists
      const playlist = playlists!.find((p) => p.id === ps)!;
      const taskId = await createTask(
        TaskType.Copy,
        t("task-progress.copying-playlist", {
          title: playlist.title,
        }),
      );
      const result = await new CopyPlaylistUsecase({
        repository: Provider.GOOGLE,
        targetPlaylistId: targetId ?? undefined,
        sourcePlaylistId: playlist.id,
        privacy: PlaylistPrivacy.Unlisted,
        allowDuplicate: allowDuplicates,
        accId: focusedAccount.id,
        onAddedPlaylist: (p) => {
          updateTaskMessage(
            taskId,
            t("task-progress.created-playlist", {
              title: p.title,
            }),
          );

          jobs.addJob(
            new CreatePlaylistJob({
              provider: Provider.GOOGLE,
              id: p.id,
              title: p.title,
              privacy: PlaylistPrivacy.Unlisted,
              accId: focusedAccount.id,
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
        onAddedPlaylistItem: (i, p, c, total) => {
          updateTaskMessage(
            taskId,
            t("task-progress.copied-playlist-item", {
              title: i.title,
            }),
          );
          updateTaskProgress(taskId, (c / total) * 100);

          jobs.addJob(
            new AddPlaylistItemJob({
              provider: Provider.GOOGLE,
              playlistId: p.id,
              itemId: i.id,
              accId: focusedAccount.id,
            }),
          );
        },
      }).execute();

      const message = result.isOk()
        ? t("task-progress.succeed-to-copy-playlist", {
            title: playlist.title,
          })
        : t("task-progress.failed-to-copy-playlist", {
            title: playlist.title,
            code: result.error.status,
          });

      if (result.isOk()) {
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
    });
    await Promise.all(copyTasks);
    invalidatePlaylistsQuery();
  };

  return {
    isOpen,
    setIsOpen,
    targetId,
    setTargetId,
    allowDuplicates,
    setAllowDuplicates,
    playlists,
    handleCopy,
  };
}

export function CopyAction({
  t,
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const {
    isOpen,
    setIsOpen,
    targetId,
    setTargetId,
    allowDuplicates,
    setAllowDuplicates,
    playlists,
    handleCopy,
  } = useCopyAction(t);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PlaylistActionButton disabled={disabled}>
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </PlaylistActionButton>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <ActionDialogHeader
          icon={Icon}
          title={t("action-modal.copy.title")}
          description={t("action-modal.copy.description")}
        />

        <div className="space-y-4 py-2">
          <TargetPlaylistSelect
            targetId={targetId}
            onTargetIdChange={setTargetId}
            playlists={playlists}
            t={t}
          />

          <AllowDuplicatesCheckbox
            checked={allowDuplicates}
            onCheckedChange={setAllowDuplicates}
            t={t}
          />
        </div>

        <ActionDialogFooter
          onCancel={() => setIsOpen(false)}
          onConfirm={handleCopy}
          cancelLabel={t("action-modal.common.cancel")}
          confirmLabel={t("action-modal.common.confirm")}
        />
      </DialogContent>
    </Dialog>
  );
}
