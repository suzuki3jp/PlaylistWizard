"use client";
import type { WithT } from "i18next";
import { Import, Pin } from "lucide-react";
import { useEffect, useState } from "react";
import { sleep } from "@/common/sleep";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Provider } from "@/entities/provider";
import { usePinnedPlaylists } from "@/features/pinned-playlists/provider";
import { useSession } from "@/lib/auth-client";
import type { UUID } from "@/usecase/actions/generateUUID";
import { FetchFullPlaylistUsecase } from "@/usecase/fetch-full-playlist";
import { ImportPlaylistUsecase } from "@/usecase/import-playlist";
import { YouTubePlaylistIdentifier } from "@/usecase/value-object/playlist-identifiers";
import {
  useSelectedPlaylists,
  useTogglePlaylistSelection,
} from "../contexts/selected-playlists";
import { useTask } from "../contexts/tasks";
import { usePlaylistsQuery } from "../queries/use-playlists";
import { signOutWithCallbackToPlaylists } from "../utils/sign-out-with-callback-to-playlists";
import { TaskStatus, TaskType } from "./tasks-monitor";

interface PlaylistCardProps {
  playlistId: string;
}

export function PlaylistCard({ playlistId, t }: PlaylistCardProps & WithT) {
  const { data: playlists, isPending } = usePlaylistsQuery();
  const { selectedPlaylists } = useSelectedPlaylists();
  const togglePlaylistSelection = useTogglePlaylistSelection();
  const { data: session, isPending: isSessionPending } = useSession();
  const { pinnedIds, pin, unpin } = usePinnedPlaylists();

  useEffect(() => {
    if (!isSessionPending && !session) {
      signOutWithCallbackToPlaylists();
    }
  }, [session, isSessionPending]);

  if (isPending) return null;
  const targetPlaylist = playlists.find((p) => p.id === playlistId);
  if (!targetPlaylist) return null;

  const isSelected = selectedPlaylists.some((pId) => pId === playlistId);
  const isPinned = pinnedIds.includes(playlistId);

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned) {
      await unpin(playlistId, targetPlaylist.provider);
    } else {
      await pin(playlistId, targetPlaylist.provider);
    }
  };

  if (!session) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: TODO
    // biome-ignore lint/a11y/noStaticElementInteractions: TODO
    <div
      key={targetPlaylist.id}
      className={`group relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-300 ${
        isSelected
          ? "border-pink-500 bg-gray-800/80"
          : "border-gray-800 bg-gray-800/50 hover:border-gray-700"
      }`}
      onClick={() => togglePlaylistSelection(targetPlaylist.id)}
    >
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        <ThumbnailImage
          src={targetPlaylist.thumbnailUrl}
          alt={targetPlaylist.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <button
          type="button"
          className="absolute top-2 right-2 cursor-pointer rounded-full bg-gray-900/70 p-1"
          onClick={handlePinToggle}
          aria-label={
            isPinned ? t("playlists.unpin-tooltip") : t("playlists.pin-tooltip")
          }
          aria-pressed={isPinned}
        >
          <Pin
            className={`size-5 rotate-45 ${isPinned ? "fill-pink-500 text-pink-500" : "text-gray-400"}`}
          />
        </button>
        {isSelected && (
          <div className="absolute top-2 left-2 rounded-full bg-pink-500 p-1">
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>selected icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate font-medium text-white">
          {targetPlaylist.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {t("playlists.video-count", {
            count: targetPlaylist.itemsTotal,
          })}
        </p>
      </div>
    </div>
  );
}

export function PlaylistImportingCard({ t }: WithT) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlistSpecifier, setPlaylistSpecifier] = useState("");
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

  if (!session) return null;

  const handleImport = async () => {
    setIsOpen(false);

    let taskId: UUID | null = null;

    const isSameService = YouTubePlaylistIdentifier.isValid(playlistSpecifier);

    if (!isSameService) {
      taskId = await createTask(
        TaskType.Import,
        t("task-progress.import.different-service"),
      );
      updateTaskStatus(taskId, TaskStatus.Error);
      await sleep(2000);
      removeTask(taskId);
      return;
    }

    // biome-ignore lint/style/noNonNullAssertion: TODO
    const playlistId = YouTubePlaylistIdentifier.from(playlistSpecifier)!.id();

    const playlist = await new FetchFullPlaylistUsecase({
      playlistId,
      repository: Provider.GOOGLE,
    }).execute();
    if (playlist.isErr()) {
      if (taskId) {
        updateTaskMessage(
          taskId,
          t("task-progress.import.failed", {
            title: "UNKNOWN",
            code: playlist.error.status,
          }),
        );
      } else {
        taskId = await createTask(
          TaskType.Import,
          t("task-progress.import.failed", {
            title: "UNKNOWN",
            code: playlist.error.status,
          }),
        );
      }
      updateTaskStatus(taskId, TaskStatus.Error);
      await sleep(2000);
      removeTask(taskId);
      return;
    }

    if (taskId) {
      updateTaskMessage(
        taskId,
        t("task-progress.import.processing", {
          title: playlist.value.title,
        }),
      );
    } else {
      taskId = await createTask(
        TaskType.Import,
        t("task-progress.import.processing", {
          title: playlist.value.title,
        }),
      );
    }

    const result = await new ImportPlaylistUsecase({
      repository: Provider.GOOGLE,
      sourcePlaylistId: playlistId,
      allowDuplicate: true,
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
      onAddedPlaylistItem: (i, _, c, total) => {
        updateTaskMessage(
          taskId,
          t("task-progress.copied-playlist-item", {
            title: i.title,
          }),
        );
        updateTaskProgress(taskId, (c / total) * 100);
      },
    }).execute();

    const message = result.isOk()
      ? t("task-progress.import.succeed", {
          title: playlist.value.title,
        })
      : t("task-progress.import.failed", {
          title: playlist.value.title,
          code: result.error.status,
        });
    if (result.isOk()) {
      updateTaskStatus(taskId, TaskStatus.Completed);
      updateTaskProgress(taskId, 100);
    } else {
      updateTaskStatus(taskId, TaskStatus.Error);
    }
    updateTaskMessage(taskId, message);
    await sleep(2000);
    removeTask(taskId);
  };

  function shouldDisableImport() {
    if (!playlistSpecifier) return true;
    if (!YouTubePlaylistIdentifier.isValid(playlistSpecifier)) return true;
    return false;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex h-full min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-700 border-dashed bg-gray-800/30 p-6 text-center transition-colors hover:bg-gray-800/50">
          <div className="mb-3 rounded-full bg-gray-800 p-3">
            <Import className="h-6 w-6 text-pink-500" />
          </div>
          <h3 className="font-medium text-lg text-white">
            {t("action-modal.import.title")}
          </h3>
          <p className="mt-2 text-gray-400 text-sm">
            {t("action-modal.import.subtitle")}
          </p>
        </div>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-pink-600 p-1.5">
              <Import className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl">
              {t("action-modal.import.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {t("action-modal.import.description")}
          </DialogDescription>
        </DialogHeader>

        <div>
          <Input
            placeholder={t("action-modal.import.placeholder")}
            value={playlistSpecifier}
            onChange={(e) => setPlaylistSpecifier(e.target.value)}
            className="selection:bg-pink-500"
          />
          {playlistSpecifier && shouldDisableImport() && (
            <div className="mt-2 text-destructive text-sm">
              {t("action-modal.import.invalid-specify")}
            </div>
          )}
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
            onClick={handleImport}
            className="bg-pink-600 text-white hover:bg-pink-700"
            disabled={shouldDisableImport()}
          >
            {t("action-modal.common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlaylistSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-800/50">
      <div className="relative aspect-video rounded-t-lg">
        <Skeleton className="absolute inset-0" />
        <div className="absolute top-2 right-2">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
