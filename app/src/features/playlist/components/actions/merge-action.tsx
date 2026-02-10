"use client";
import type { TFunction } from "i18next";
import { useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DEFAULT, ga4Events } from "@/constants";
import { useAuth } from "@/presentation/hooks/useAuth";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { CreatePlaylistJob } from "@/usecase/command/jobs/create-playlist";
import { MergePlaylistUsecase } from "@/usecase/merge-playlist";
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

function useMergeAction(t: TFunction) {
  const history = useHistory();
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>(DEFAULT);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();
  const { selectedPlaylists } = useSelectedPlaylists();

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

  const handleMerge = async () => {
    if (!auth) return;
    setIsOpen(false);
    const isTargeted = targetId !== DEFAULT;

    emitGa4Event(ga4Events.mergePlaylists);

    const jobs = new JobsBuilder();

    const taskId = await createTask(
      TaskType.Merge,
      t("task-progress.creating-new-playlist"),
    );
    const result = await new MergePlaylistUsecase({
      accessToken: auth.accessToken,
      repository: auth.provider,
      targetPlaylistId: isTargeted ? targetId : undefined,
      sourcePlaylistIds: selectedPlaylists,
      allowDuplicate: allowDuplicates,
      onAddedPlaylist: (p) => {
        updateTaskMessage(
          taskId,
          t("task-progress.created-playlist", {
            title: p.title,
          }),
        );
        jobs.addJob(
          new CreatePlaylistJob({
            accessToken: auth.accessToken,
            provider: auth.provider,
            id: p.id,
            title: p.title,
            privacy: PlaylistPrivacy.Unlisted,
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
            accessToken: auth.accessToken,
            provider: auth.provider,
            playlistId: isTargeted ? targetId : p.id,
            itemId: i.id,
          }),
        );
      },
    }).execute();

    const joinedTitles = playlists
      ?.filter((p) => selectedPlaylists.includes(p.id))
      .map((p) => p.title)
      .join(", ");
    const message = result.isOk()
      ? t("task-progress.succeed-to-merge-playlist", {
          title: joinedTitles,
        })
      : t("task-progress.failed-to-merge-playlist", {
          title: joinedTitles,
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
    handleMerge,
  };
}

export function MergeAction({
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
    handleMerge,
  } = useMergeAction(t);

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
          title={t("action-modal.merge.title")}
          description={t("action-modal.merge.description")}
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
          onConfirm={handleMerge}
          cancelLabel={t("action-modal.common.cancel")}
          confirmLabel={t("action-modal.common.confirm")}
        />
      </DialogContent>
    </Dialog>
  );
}
