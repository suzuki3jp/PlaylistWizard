"use client";
import { StructuredPlaylistsDefinitionLocalStorage } from "@playlistwizard/core/structured-playlists";
import {
  Check,
  Play,
  RefreshCw as SyncIcon,
  TriangleAlert,
} from "lucide-react";
import { type PropsWithChildren, useState } from "react";
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
import { useHistory } from "../contexts/history";
import { useTask } from "../contexts/tasks";
import { useInvalidatePlaylistsQuery } from "../queries/use-playlists";
import { PlaylistActionButton } from "./playlist-action-button";
import { TaskStatus, TaskType } from "./tasks-monitor";

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
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();

  const definition = StructuredPlaylistsDefinitionLocalStorage.get();
  const isValidDefinition = definition.isOk();
  // TODO: Add more validation (e.g. hasDependencyCycle)

  async function handleSync() {
    if (!window.confirm(commonT("beta-confirm"))) return;

    setIsOpen(false);
    if (!auth || !isValidDefinition) return;
    const structureData = definition.value;

    const jobs = new JobsBuilder();
    const taskId = await createTask(
      TaskType.Sync,
      t("sync.progress.preparing"),
    );

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

  function handleDialogOpenChange(open: boolean) {
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <PlaylistActionButton>
          <SyncIcon className="mr-2 h-4 w-4" />
          {t("sync.button")}
        </PlaylistActionButton>
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
            disabled={!isValidDefinition} // Enable only if data is valid
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
  // TODO: localize messages
  if (definition.isOk()) {
    return (
      <ResultCard title="ファイル検証完了" type="success">
        <p>プロバイダー: {definition.value.provider}</p>
        <p>ルートプレイリスト: {definition.value.playlists.length}個</p>
      </ResultCard>
    );
  }

  // TODO: Improve error messages
  return (
    <ResultCard title="ファイル検証エラー" type="error">
      <p>{definition.error.message}</p>
    </ResultCard>
  );
}

function ResultCard({
  type,
  title,
  children,
}: PropsWithChildren<{ type: "success" | "error"; title: string }>) {
  return (
    <div
      className={`rounded-lg p-4 ${type === "success" ? "border-green-800 bg-green-900/20" : "border-red-900 bg-red-900/20"} border`}
    >
      <div className="flex space-x-2">
        {type === "success" ? (
          <Check color="#05df72" />
        ) : (
          <TriangleAlert color="#ff4d4f" />
        )}
        <h4
          className={`mb-2 font-medium ${type === "success" ? "text-green-400" : "text-red-400"}`}
        >
          {title}
        </h4>
      </div>

      <div className="space-y-1 text-gray-300 text-sm">{children}</div>
    </div>
  );
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
