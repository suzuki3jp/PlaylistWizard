"use client";
import { Shuffle as ShuffleIcon } from "lucide-react";

import { PlaylistManager } from "@/actions/playlist-manager";
import type { PlaylistActionProps } from "@/components/playlists/playlists-actions";
import { Button } from "@/components/ui/button";
import { providerToAdapterType } from "@/helpers/providerToAdapterType";
import { sleep } from "@/helpers/sleep";
import { useAuth } from "@/hooks/useAuth";

export function ShuffleButton({
  t,
  playlists,
  refreshPlaylists,
  createTask,
  updateTaskMessage,
  updateTaskStatus,
  updateTaskProgress,
  removeTask,
}: PlaylistActionProps) {
  const auth = useAuth();
  if (!auth) return null;

  const manager = new PlaylistManager(
    auth.accessToken,
    providerToAdapterType(auth.provider),
  );

  const handleShuffle = async () => {
    const shuffleTasks = playlists
      .filter((ps) => ps.isSelected)
      .map(async (ps) => {
        const playlist = ps.data;
        const taskId = await createTask(
          "shuffle",
          t("task-progress.shuffle.processing", {
            title: playlist.title,
          }),
        );
        const result = await manager.shuffle({
          targetId: playlist.id,
          ratio: 0.4,
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
          },
        });

        const message = result.isOk()
          ? t("task-progress.shuffle.succeed", {
              title: playlist.title,
            })
          : t("task-progress.shuffle.failed", {
              title: playlist.title,
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
      });

    await Promise.all(shuffleTasks);
    refreshPlaylists();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
      disabled={playlists.filter((p) => p.isSelected).length === 0}
      onClick={handleShuffle}
    >
      <ShuffleIcon className="mr-2 h-4 w-4" />
      {t("playlists.shuffle")}
    </Button>
  );
}
