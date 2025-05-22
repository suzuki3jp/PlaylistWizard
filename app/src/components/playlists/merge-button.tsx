"use client";
import { HelpCircle, GitMerge as MergeIcon } from "lucide-react";
import { useState } from "react";

import { PlaylistManager } from "@/actions/playlist-manager";
import type { PlaylistActionProps } from "@/components/playlists/playlists-actions";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT } from "@/constants";
import { providerToAdapterType } from "@/helpers/providerToAdapterType";
import { sleep } from "@/helpers/sleep";
import { useAuth } from "@/hooks/useAuth";

export function MergeButton({
  t,
  playlists,
  refreshPlaylists,
  createTask,
  updateTaskMessage,
  updateTaskProgress,
  updateTaskStatus,
  removeTask,
}: PlaylistActionProps) {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>(DEFAULT);
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  if (!auth) return null;

  const handleMerge = async () => {
    setIsOpen(false);
    const isTargeted = targetId !== DEFAULT;
    const manager = new PlaylistManager(
      auth.accessToken,
      providerToAdapterType(auth.provider),
    );

    const taskId = await createTask(
      "merge",
      t("task-progress.creating-new-playlist"),
    );
    const result = await manager.merge({
      targetId: isTargeted ? targetId : undefined,
      sourceIds: playlists
        .filter((ps) => ps.isSelected)
        .map((ps) => ps.data.id),
      allowDuplicates,
      onAddedPlaylist: (p) => {
        updateTaskMessage(
          taskId,
          t("task-progress.created-playlist", {
            title: p.title,
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
      onAddedPlaylistItem: (i, c, total) => {
        updateTaskMessage(
          taskId,
          t("task-progress.copied-playlist-item", {
            title: i.title,
          }),
        );
        updateTaskProgress(taskId, (c / total) * 100);
      },
    });

    const message = result.isOk()
      ? t("task-progress.succeed-to-merge-playlist", {
          title: playlists
            .filter((ps) => ps.isSelected)
            .map((ps) => ps.data.title)
            .join(", "),
        })
      : t("task-progress.failed-to-merge-playlist", {
          title: playlists
            .filter((ps) => ps.isSelected)
            .map((ps) => ps.data.title)
            .join(", "),
          code: result.error.status,
        });

    if (result.isOk()) {
      updateTaskStatus(taskId, "completed");
      updateTaskProgress(taskId, 100);
    } else {
      updateTaskStatus(taskId, "error");
    }
    updateTaskMessage(taskId, message);

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
          disabled={playlists.filter((p) => p.isSelected).length < 2}
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
              {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
              <label className="font-medium text-sm text-white">
                {t("action-modal.common.target.title")}
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">
                        {t("action-modal.common.help")}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="border-gray-700 bg-gray-800 text-white">
                    <p>{t("action-modal.common.target.description")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                  {playlists.map((playlist) => (
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
              id="allowDuplicates"
              checked={allowDuplicates}
              onCheckedChange={(checked) =>
                setAllowDuplicates(checked as boolean)
              }
              className="border-gray-600 bg-gray-800 shadow-[0_0_3px_rgba(255,255,255,0.4)] hover:shadow-[0_0_4px_rgba(255,255,255,0.5)] data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="allowDuplicates"
                className="cursor-pointer font-medium text-sm text-white"
              >
                {t("action-modal.common.allow-duplicates.title")}
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">
                        {t("action-modal.common.help")}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="border-gray-700 bg-gray-800 text-white">
                    <p>
                      {t("action-modal.common.allow-duplicates.description")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
