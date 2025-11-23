"use client";
import type { WithT } from "i18next";
import { Funnel as ExtractIcon, HelpCircle } from "lucide-react";
import { useCallback, useId, useState } from "react";
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
import MultipleSelector, {
  type Option,
} from "@/presentation/shadcn/multi-select";
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
import { ExtractPlaylistItemUsecase } from "@/usecase/extract-playlist-item";
import { FetchFullPlaylistUsecase } from "@/usecase/fetch-full-playlist";
import { useHistory } from "../contexts/history";
import { usePlaylists } from "../contexts/playlists";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { useTask } from "../contexts/tasks";
import { type FullPlaylist, PlaylistPrivacy } from "../entities";
import { useRefreshPlaylists } from "../hooks/use-refresh-playlists";
import { TaskStatus, TaskType } from "./tasks-monitor";

export function ExtractButton({ t }: WithT) {
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState(DEFAULT);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const allowDuplicatesElementId = useId();

  const [_artists, setArtists] = useState<string[]>([]);
  const [artistMultiOptions, setArtistMultiOptions] = useState<Option[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Option[]>([]);

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
  const auth = useAuth();
  const { selectedPlaylists } = useSelectedPlaylists();
  const refreshPlaylists = useRefreshPlaylists();

  const refreshItems = useCallback(
    async (ids: string[]) => {
      if (!auth) return;
      const itemsPromises = ids.map(async (id) => {
        const result = await new FetchFullPlaylistUsecase({
          playlistId: id,
          accessToken: auth.accessToken,
          repository: auth.provider,
        }).execute();
        if (result.isErr())
          return {
            id: "",
            title: "",
            items: [],
            itemsTotal: 0,
            thumbnail: "",
            url: "",
            thumbnailUrl: "",
            provider: auth.provider,
          } as FullPlaylist;
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

  if (!playlists) return null;

  async function handleOnOpen(open: boolean) {
    if (open) {
      await refreshItems(selectedPlaylists);
    }

    setIsOpen(open);
  }

  async function handleExtract() {
    setIsOpen(false);
    setSelectedArtists([]);
    if (!auth) return;
    const isTargeted = targetId !== DEFAULT;
    const taskId = await createTask(
      TaskType.Extract,
      t("task-progress.creating-new-playlist"),
    );

    const jobs = new JobsBuilder();

    const result = await new ExtractPlaylistItemUsecase({
      accessToken: auth.accessToken,
      repository: auth.provider,
      targetPlaylistId: isTargeted ? targetId : undefined,
      sourceIds: selectedPlaylists,
      artistNames: selectedArtists.map((o) => o.value),
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
            privacy: PlaylistPrivacy.UNLISTED,
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
            playlistId: p.id,
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
      ? t("task-progress.extract.success", {
          title: joinedTitles,
        })
      : t("task-progress.extract.failed", {
          title: joinedTitles,
          code: result.error.status,
        });
    if (result.isOk()) {
      updateTaskProgress(taskId, 100);
      updateTaskStatus(taskId, TaskStatus.Completed);
    } else {
      updateTaskStatus(taskId, TaskStatus.Error);
    }
    updateTaskMessage(taskId, message);
    refreshPlaylists();

    history.addCommand(jobs.toCommand());

    await sleep(2000);
    removeTask(taskId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          disabled={selectedPlaylists.length === 0}
        >
          <ExtractIcon className="mr-2 h-4 w-4" />
          {t("playlists.extract")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: TODO */}
              <label className="font-medium text-sm text-white">
                {t("action-modal.extract.artist.title")}
              </label>
              <Tooltip
                description={t("action-modal.extract.artist.description")}
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
            <MultipleSelector
              value={selectedArtists}
              onChange={setSelectedArtists}
              defaultOptions={artistMultiOptions}
              placeholder={t("action-modal.extract.artist.placeholder")}
              className="border-none bg-gray-800"
              optionsClassName="bg-gray-800 border-none"
              itemClassName="hover:bg-pink-600 text-white"
            />
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
            onClick={handleExtract}
            className="bg-pink-600 text-white hover:bg-pink-700"
          >
            {t("action-modal.common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
