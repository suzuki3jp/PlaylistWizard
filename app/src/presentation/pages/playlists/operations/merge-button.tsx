"use client";
import { HelpCircle, GitMerge as MergeIcon } from "lucide-react";
import { useId, useState } from "react";

import { sleep } from "@/common/sleep";
import { DEFAULT } from "@/constants";
import { Tooltip } from "@/presentation/common/tooltip";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/shadcn/button";
import { Checkbox } from "@/presentation/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/presentation/shadcn/select";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { CreatePlaylistJob } from "@/usecase/command/jobs/create-playlist";
import { MergePlaylistUsecase } from "@/usecase/merge-playlist";
import { usePlaylists, useTask } from "../contexts";
import { useHistory } from "../history";
import type { PlaylistOperationProps } from "./index";

export function MergeButton({ t, refreshPlaylists }: PlaylistOperationProps) {
  const history = useHistory();
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>(DEFAULT);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const allowDuplicatesElementId = useId();

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

  const handleMerge = async () => {
    setIsOpen(false);
    const isTargeted = targetId !== DEFAULT;

    const jobs = new JobsBuilder();

    const taskId = await createTask(
      "merge",
      t("task-progress.creating-new-playlist"),
    );
    const result = await new MergePlaylistUsecase({
      accessToken: auth.accessToken,
      repository: auth.provider,
      targetPlaylistId: isTargeted ? targetId : undefined,
      sourcePlaylistIds: selectedPlaylists.map((ps) => ps.data.id),
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
            privacy: "unlisted",
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

    const message = result.isOk()
      ? t("task-progress.succeed-to-merge-playlist", {
          title: selectedPlaylists.map((ps) => ps.data.title).join(", "),
        })
      : t("task-progress.failed-to-merge-playlist", {
          title: selectedPlaylists.map((ps) => ps.data.title).join(", "),
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
    refreshPlaylists();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          disabled={selectedPlaylists.length < 2}
        >
          <MergeIcon className="mr-2 h-4 w-4" />
          {t("playlists.merge")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-pink-600 p-1.5">
              <MergeIcon className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl">
              {t("action-modal.merge.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {t("action-modal.merge.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: TODO */}
              <label className="font-medium text-sm text-white">
                {t("action-modal.common.target.title")}
              </label>
              <Tooltip
                description={t("action-modal.common.target.description")}
                className="border-gray-700 bg-gray-800 text-white"
              >
                <Button
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">
                    {t("action-modal.common.help")}
                  </span>
                </Button>
              </Tooltip>
            </div>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="w-full border-gray-700 bg-gray-800 text-white focus:ring-pink-500">
                <SelectValue aria-label={targetId} />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800 text-white">
                <SelectGroup>
                  <SelectItem value={DEFAULT} className="focus:bg-pink-600">
                    {t("action-modal.common.create-new-playlist")}
                  </SelectItem>
                  <SelectLabel className="text-gray-400">
                    {t("action-modal.common.existing-playlists")}
                  </SelectLabel>
                  {playlists?.map((playlist) => (
                    <SelectItem
                      key={playlist.data.id}
                      value={playlist.data.id}
                      className="focus:bg-pink-600"
                    >
                      {playlist.data.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={allowDuplicatesElementId}
              checked={allowDuplicates}
              onCheckedChange={(checked) =>
                setAllowDuplicates(checked as boolean)
              }
              className="border-gray-600 bg-gray-800 shadow-[0_0_3px_rgba(255,255,255,0.4)] hover:shadow-[0_0_4px_rgba(255,255,255,0.5)] data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor={allowDuplicatesElementId}
                className="cursor-pointer font-medium text-sm text-white"
              >
                {t("action-modal.common.allow-duplicates.title")}
              </label>
              <Tooltip
                description={t(
                  "action-modal.common.allow-duplicates.description",
                )}
                className="border-gray-700 bg-gray-800 text-white"
              >
                <Button
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">
                    {t("action-modal.common.help")}
                  </span>
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          >
            {t("action-modal.common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleMerge}
            className="bg-pink-600 text-white hover:bg-pink-700"
          >
            {t("action-modal.common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
