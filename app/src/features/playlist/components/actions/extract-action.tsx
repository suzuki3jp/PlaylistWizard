"use client";
import type { TFunction } from "i18next";
import { useCallback, useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import MultipleSelector, { type Option } from "@/components/ui/multi-select";
import { DEFAULT, ga4Events } from "@/constants";
import { useAuth } from "@/presentation/hooks/useAuth";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { CreatePlaylistJob } from "@/usecase/command/jobs/create-playlist";
import { ExtractPlaylistItemUsecase } from "@/usecase/extract-playlist-item";
import { FetchFullPlaylistUsecase } from "@/usecase/fetch-full-playlist";
import { useHistory } from "../../contexts/history";
import { useSelectedPlaylists } from "../../contexts/selected-playlists";
import { useTask } from "../../contexts/tasks";
import { type FullPlaylist, PlaylistPrivacy } from "../../entities";
import {
  useInvalidatePlaylistsQuery,
  usePlaylistsQuery,
} from "../../queries/use-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import { TaskStatus, TaskType } from "../tasks-monitor";
import { ActionDialogFooter } from "./action-dialog-footer";
import { ActionDialogHeader } from "./action-dialog-header";
import { AllowDuplicatesCheckbox } from "./allow-duplicates-checkbox";
import { HelpTooltipButton } from "./help-tooltip-button";
import { TargetPlaylistSelect } from "./target-playlist-select";
import type { PlaylistActionComponentProps } from "./types";

function useExtractAction(t: TFunction) {
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState(DEFAULT);
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  const [_artists, setArtists] = useState<string[]>([]);
  const [artistMultiOptions, setArtistMultiOptions] = useState<Option[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Option[]>([]);

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
  const auth = useAuth();
  const { selectedPlaylists } = useSelectedPlaylists();
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();

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

    emitGa4Event(ga4Events.extractPlaylist);

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
            playlistId: p.id,
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
    invalidatePlaylistsQuery();

    history.addCommand(jobs.toCommand());

    await sleep(2000);
    removeTask(taskId);
  }

  return {
    isOpen,
    handleOnOpen,
    targetId,
    setTargetId,
    allowDuplicates,
    setAllowDuplicates,
    artistMultiOptions,
    selectedArtists,
    setSelectedArtists,
    playlists,
    handleExtract,
  };
}

export function ExtractAction({
  t,
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const {
    isOpen,
    handleOnOpen,
    targetId,
    setTargetId,
    allowDuplicates,
    setAllowDuplicates,
    artistMultiOptions,
    selectedArtists,
    setSelectedArtists,
    playlists,
    handleExtract,
  } = useExtractAction(t);

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpen}>
      <DialogTrigger asChild>
        <PlaylistActionButton disabled={disabled}>
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </PlaylistActionButton>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <ActionDialogHeader
          icon={Icon}
          title={t("action-modal.extract.title")}
          description={t("action-modal.extract.description")}
        />

        <div className="space-y-4 py-2">
          <TargetPlaylistSelect
            targetId={targetId}
            onTargetIdChange={setTargetId}
            playlists={playlists}
            t={t}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: TODO */}
              <label className="font-medium text-sm text-white">
                {t("action-modal.extract.artist.title")}
              </label>
              <HelpTooltipButton
                description={t("action-modal.extract.artist.description")}
                t={t}
              />
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

          <AllowDuplicatesCheckbox
            checked={allowDuplicates}
            onCheckedChange={setAllowDuplicates}
            t={t}
          />
        </div>

        <ActionDialogFooter
          onCancel={() => handleOnOpen(false)}
          onConfirm={handleExtract}
          cancelLabel={t("action-modal.common.cancel")}
          confirmLabel={t("action-modal.common.confirm")}
        />
      </DialogContent>
    </Dialog>
  );
}
