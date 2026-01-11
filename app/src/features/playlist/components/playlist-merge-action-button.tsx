"use client";
import type { WithT } from "i18next";
import { HelpCircle, GitMerge as MergeIcon } from "lucide-react";
import { useId, useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT, ga4Events } from "@/constants";
import { Tooltip } from "@/presentation/common/tooltip";
import { useAuth } from "@/presentation/hooks/useAuth";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { CreatePlaylistJob } from "@/usecase/command/jobs/create-playlist";
import { MergePlaylistUsecase } from "@/usecase/merge-playlist";
import { useHistory } from "../contexts/history";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { useTask } from "../contexts/tasks";
import { PlaylistPrivacy } from "../entities";
import {
  useInvalidatePlaylistsQuery,
  usePlaylistsQuery,
} from "../queries/use-playlists";
import { PlaylistActionButton } from "./playlist-action-button";
import { TaskStatus, TaskType } from "./tasks-monitor";

export function MergeButton({ t }: WithT) {
  const history = useHistory();
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>(DEFAULT);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const allowDuplicatesElementId = useId();
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();
  const { selectedPlaylists } = useSelectedPlaylists();

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

  if (isPending) return null;

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
      .filter((p) => selectedPlaylists.includes(p.id))
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PlaylistActionButton disabled={selectedPlaylists.length < 2}>
          <MergeIcon className="mr-2 h-4 w-4" />
          {t("playlists.merge")}
        </PlaylistActionButton>
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
                      key={playlist.id}
                      value={playlist.id}
                      className="focus:bg-pink-600"
                    >
                      {playlist.title}
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
