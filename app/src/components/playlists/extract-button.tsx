"use client";
import { Funnel as ExtractIcon, HelpCircle } from "lucide-react";
import { useCallback, useState } from "react";

import { PlaylistManager } from "@/actions/playlist-manager";
import type { IAdapterFullPlaylist } from "@/adapters";
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
import MultipleSelector, { type Option } from "../ui/multi-select";

export function ExtractButton({
  t,
  playlists,
  refreshPlaylists,
  createTask,
  updateTaskMessage,
  updateTaskProgress,
  updateTaskStatus,
  removeTask,
}: PlaylistActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState(DEFAULT);
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  const [artists, setArtists] = useState<string[]>([]);
  const [artistMultiOptions, setArtistMultiOptions] = useState<Option[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Option[]>([]);

  const auth = useAuth();

  const refreshItems = useCallback(
    async (ids: string[]) => {
      if (!auth) return;
      const itemsPromises = ids.map(async (id) => {
        const manager = new PlaylistManager(
          auth.accessToken as string,
          providerToAdapterType(auth.provider as "google" | "spotify"),
        );
        const result = await manager.getFullPlaylist(id);
        if (result.isErr())
          return {
            id: "",
            title: "",
            items: [],
            itemsTotal: 0,
            thumbnail: "",
            url: "",
            thumbnailUrl: "",
          } as IAdapterFullPlaylist;
        return result.value;
      });
      const items = await Promise.all(itemsPromises);
      const artists = items
        .flatMap((i) => i.items)
        .map((i) => i.author)
        .filter((a, i, self) => self.indexOf(a) === i);
      setArtists(artists);
      function convertArtistsToOptions(artists: string[]): Option[] {
        return artists.map((artist) => {
          return {
            label: artist,
            value: artist,
          };
        });
      }
      setArtistMultiOptions(convertArtistsToOptions(artists));
    },
    [auth],
  );

  async function handleOnOpen(open: boolean) {
    if (open) {
      await refreshItems(
        playlists.filter((p) => p.isSelected).map((p) => p.data.id),
      );
    }

    setIsOpen(open);
  }

  async function handleExtract() {
    setIsOpen(false);
    setSelectedArtists([]);
    if (!auth) return;
    const isTargeted = targetId !== DEFAULT;
    const manager = new PlaylistManager(
      auth.accessToken,
      providerToAdapterType(auth.provider),
    );

    const taskId = await createTask(
      "extract",
      t("task-progress.creating-new-playlist"),
    );

    const result = await manager.extract({
      targetId: isTargeted ? targetId : undefined,
      sourceIds: playlists
        .filter((ps) => ps.isSelected)
        .map((ps) => ps.data.id),
      extractArtists: selectedArtists.map((o) => o.value),
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
      ? t("task-progress.extract.success", {
          title: playlists
            .filter((ps) => ps.isSelected)
            .map((ps) => ps.data.title)
            .join(", "),
        })
      : t("task-progress.extract.failed", {
          title: playlists
            .filter((ps) => ps.isSelected)
            .map((ps) => ps.data.title)
            .join(", "),
          code: result.error.status,
        });
    if (result.isOk()) {
      updateTaskProgress(taskId, 100);
      updateTaskStatus(taskId, "completed");
    } else {
      updateTaskStatus(taskId, "error");
    }
    updateTaskMessage(taskId, message);
    refreshPlaylists();

    await sleep(2000);
    removeTask(taskId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
          disabled={playlists.filter((p) => p.isSelected).length === 0}
        >
          <ExtractIcon className="mr-2 h-4 w-4" />
          {t("playlists.extract")}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border border-gray-800 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-pink-600 p-1.5">
              <ExtractIcon className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl">
              {t("action-modal.extract.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {t("action-modal.extract.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
              <label className="text-sm font-medium text-white">
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
                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                    <p>{t("action-modal.common.target.description")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white focus:ring-pink-500">
                <SelectValue aria-label={targetId} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
              <label className="text-sm font-medium text-white">
                {t("action-modal.extract.artist.title")}
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
                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                    <p>{t("action-modal.extract.artist.description")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <MultipleSelector
              value={selectedArtists}
              onChange={setSelectedArtists}
              defaultOptions={artistMultiOptions}
              placeholder={t("action-modal.extract.artist.placeholder")}
              className="bg-gray-800 border-none"
              optionsClassName="bg-gray-800 border-none"
              itemClassName="hover:bg-pink-600 text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowDuplicates"
              checked={allowDuplicates}
              onCheckedChange={(checked) =>
                setAllowDuplicates(checked as boolean)
              }
              className="border-gray-600 bg-gray-800 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600 shadow-[0_0_3px_rgba(255,255,255,0.4)] hover:shadow-[0_0_4px_rgba(255,255,255,0.5)]"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="allowDuplicates"
                className="text-sm font-medium text-white cursor-pointer"
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
                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                    <p>
                      {t("action-modal.common.allow-duplicates.description")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
          >
            {t("action-modal.common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleExtract}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            {t("action-modal.common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
