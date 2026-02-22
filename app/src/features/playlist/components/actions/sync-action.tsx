"use client";
import { Play } from "lucide-react";
import { useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
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
import { ga4Events } from "@/constants";
import { Provider } from "@/entities/provider";
import { useStructuredPlaylistsDefinition } from "@/features/structured-playlists-definition/context";
import { useSession } from "@/lib/auth-client";
import { useT } from "@/presentation/hooks/t/client";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { SyncStructuredPlaylistsUsecase } from "@/usecase/sync-structured-playlists";
import { useHistory } from "../../contexts/history";
import { useTask } from "../../contexts/tasks";
import { useInvalidatePlaylistsQuery } from "../../queries/use-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import { StructuredPlaylistsDefinitionPreview } from "../structured-playlists-definition-preview";
import { TaskStatus, TaskType } from "../tasks-monitor";
import type { PlaylistActionComponentProps } from "./types";

function useSyncAction() {
  const { t } = useT("operation");
  const { t: commonT } = useT();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const {
    dispatchers: {
      createTask,
      updateTaskMessage,
      updateTaskProgress,
      updateTaskStatus,
      removeTask,
    },
  } = useTask();
  const history = useHistory();
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();

  const [definition] = useStructuredPlaylistsDefinition();
  const isValidDefinition = definition !== null;

  async function handleSync() {
    if (!window.confirm(commonT("beta-confirm"))) return;

    setIsOpen(false);
    if (!session || !isValidDefinition) return;
    const structureData = definition;

    emitGa4Event(ga4Events.syncPlaylist);

    const jobs = new JobsBuilder();
    const taskId = await createTask(
      TaskType.Sync,
      t("sync.progress.preparing"),
    );

    const result = await new SyncStructuredPlaylistsUsecase({
      repository: Provider.GOOGLE,
      definitionJson: structureData,
      onExecutingSyncStep: (step) => {
        updateTaskMessage(
          taskId,
          t("sync.progress.adding", { item: step.item.title }),
        );
      },
      onExecutedSyncStep: (step, current, total) => {
        updateTaskProgress(taskId, (current / total) * 100);
        updateTaskMessage(
          taskId,
          t("sync.progress.added", { item: step.item.title }),
        );
        jobs.addJob(
          new AddPlaylistItemJob({
            provider: Provider.GOOGLE,
            playlistId: step.playlistId,
            itemId: step.item.id,
          }),
        );
      },
    }).execute();

    const message = result.isOk()
      ? t("sync.progress.success")
      : t("sync.progress.failure", {
          error: `${result.error.type.toUpperCase()}: ${result.error.message}`,
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
    invalidatePlaylistsQuery();
  }

  return { t, isOpen, setIsOpen, definition, isValidDefinition, handleSync };
}

export default function SyncAction({
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const { t, isOpen, setIsOpen, definition, isValidDefinition, handleSync } =
    useSyncAction();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PlaylistActionButton disabled={disabled}>
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </PlaylistActionButton>
      </DialogTrigger>

      <DialogContent className="border-gray-800 bg-gray-900 sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Icon className="h-5 w-5 text-pink-400" />
            {t("sync.dialog.title")}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t("sync.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <StructuredPlaylistsDefinitionPreview definition={definition} t={t} />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
          >
            {t("sync.dialog.cancel")}
          </Button>

          <Button
            onClick={handleSync}
            className="bg-pink-600 text-white hover:bg-pink-700"
            disabled={!isValidDefinition}
          >
            <Play className="mr-2 h-4 w-4" />
            {t("sync.dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
