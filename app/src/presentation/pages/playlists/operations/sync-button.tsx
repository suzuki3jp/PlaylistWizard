"use client";
import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionLocalStorage,
} from "@playlistwizard/core/structured-playlists";
import { Check, Play, RefreshCw as SyncIcon } from "lucide-react";
import { useState } from "react";
import { sleep } from "@/common/sleep";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/shadcn/dialog";
import { StructuredPlaylistsDefinitionDeserializeErrorCode } from "@/repository/structured-playlists/deserialize";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { SyncStructuredPlaylistsUsecase } from "@/usecase/sync-structured-playlists";
import { useTask } from "../contexts";
import { useHistory } from "../history";

export default function SyncButtonSSR() {
  const { t } = useT("operation");
  const { t: commonT } = useT();
  const auth = useAuth();
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

  const definition = StructuredPlaylistsDefinitionLocalStorage.get();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [structureData, setStructureData] =
    useState<StructuredPlaylistsDefinition | null>(null);

  async function handleSync() {
    if (!window.confirm(commonT("beta-confirm"))) return;

    setIsOpen(false);
    if (!auth || !structureData) return;

    const jobs = new JobsBuilder();
    const taskId = await createTask("sync", t("sync.progress.preparing"));

    const result = await new SyncStructuredPlaylistsUsecase({
      accessToken: auth.accessToken,
      repository: auth.provider,
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
            accessToken: auth.accessToken,
            provider: auth.provider,
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
      updateTaskStatus(taskId, "completed");
      updateTaskMessage(taskId, message);
    } else {
      updateTaskStatus(taskId, "error");
      updateTaskMessage(taskId, message);
    }

    history.addCommand(jobs.toCommand());

    await sleep(2000);
    removeTask(taskId);
  }

  function handleDialogOpenChange(open: boolean) {
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
        >
          <SyncIcon className="mr-2 h-4 w-4" />
          {t("sync.button")}
        </Button>
      </DialogTrigger>

      <DialogContent className="border-gray-800 bg-gray-900 sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <SyncIcon className="h-5 w-5 text-pink-400" />
            {t("sync.dialog.title")}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t("sync.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <StructuredPlaylistsDefinitionPreview definition={definition} />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleDialogOpenChange(false)}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
          >
            {t("sync.dialog.cancel")}
          </Button>

          <Button
            onClick={handleSync}
            className="bg-pink-600 text-white hover:bg-pink-700"
            disabled={!structureData || !!validationError} // Enable only if data is valid
          >
            <Play className="mr-2 h-4 w-4" />
            {t("sync.dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StructuredPlaylistsDefinitionPreview({
  definition,
}: {
  definition: ReturnType<
    (typeof StructuredPlaylistsDefinitionLocalStorage)["get"]
  >;
}) {
  if (definition.isOk()) {
    return (
      <div className="rounded-lg border border-green-800 bg-green-900/20 p-4">
        {/* TODO: Add translations */}
        <div className="flex space-x-2">
          <Check color="#05df72" />
          <h4 className="mb-2 font-medium text-green-400">ファイル検証完了</h4>
        </div>
        <div className="space-y-1 text-gray-300 text-sm">
          <p>プロバイダー: {definition.value.provider}</p>
          <p>ルートプレイリスト: {definition.value.playlists.length}個</p>
        </div>
      </div>
    );
  }

  return <></>;
}

const StructuredPlaylistsDefinitionValidationErrorMessages: Record<
  Exclude<
    StructuredPlaylistsDefinitionDeserializeErrorCode,
    StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR
  >,
  string
> = {
  // Deserialization errors
  [StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON]:
    "Invalid JSON format. Please check the file syntax.",
  [StructuredPlaylistsDefinitionDeserializeErrorCode.DEPENDENCY_CYCLE]:
    "The structured playlist definition contains a dependency cycle. Please resolve the circular dependencies or recreate the file.",
  [StructuredPlaylistsDefinitionDeserializeErrorCode.UNKNOWN_ERROR]:
    "An unknown error occurred while processing the file. This is likely a bug. Please report it on GitHub: https://github.com/suzuki3jp/playlistwizard/issues",
};
