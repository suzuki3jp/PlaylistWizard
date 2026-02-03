"use client";
import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { StructuredPlaylistsDefinitionLocalStorage } from "@playlistwizard/core/structured-playlists";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Music,
  Play,
  RefreshCw as SyncIcon,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import { type PropsWithChildren, useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import type { Playlist } from "@/features/playlist/entities";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { StructuredPlaylistsDefinitionDeserializeErrorCode } from "@/repository/structured-playlists/deserialize";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { SyncStructuredPlaylistsUsecase } from "@/usecase/sync-structured-playlists";
import { useHistory } from "../contexts/history";
import { useTask } from "../contexts/tasks";
import {
  useInvalidatePlaylistsQuery,
  usePlaylistsQuery,
} from "../queries/use-playlists";
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

    emitGa4Event(ga4Events.syncPlaylist);

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

function collectAllPlaylistDefs(
  playlistDefs: PlaylistDefinition[],
): PlaylistDefinition[] {
  const result: PlaylistDefinition[] = [];
  for (const def of playlistDefs) {
    result.push(def);
    if (def.dependencies) {
      result.push(...collectAllPlaylistDefs(def.dependencies));
    }
  }
  return result;
}

function calculateDefinitionStats(
  definition: StructuredPlaylistsDefinition,
  playlists: Playlist[],
) {
  const allDefs = collectAllPlaylistDefs(definition.playlists);
  const playlistMap = new Map(playlists.map((p) => [p.id, p]));

  let totalTracks = 0;
  let unknownCount = 0;

  for (const def of allDefs) {
    const playlist = playlistMap.get(def.id);
    if (playlist) {
      totalTracks += playlist.itemsTotal;
    } else {
      unknownCount++;
    }
  }

  return {
    totalPlaylists: allDefs.length,
    totalTracks,
    unknownCount,
  };
}

function StructuredPlaylistsDefinitionPreview({
  definition,
}: {
  definition: ReturnType<
    (typeof StructuredPlaylistsDefinitionLocalStorage)["get"]
  >;
}) {
  const { data: playlists, isPending } = usePlaylistsQuery();

  // TODO: localize messages
  if (definition.isOk()) {
    const stats =
      !isPending && playlists
        ? calculateDefinitionStats(definition.value, playlists)
        : null;

    return (
      <ResultCard title="ファイル検証完了" type="success">
        <p>プロバイダー: {definition.value.provider}</p>
        <p>ルートプレイリスト: {definition.value.playlists.length}個</p>
        {stats && (
          <>
            <p>
              総プレイリスト数: {stats.totalPlaylists}個 / 合計曲数:{" "}
              {stats.totalTracks}曲
            </p>
            {stats.unknownCount > 0 && (
              <p className="text-yellow-400">
                <TriangleAlert className="mr-1 inline h-4 w-4" />
                {stats.unknownCount}個のプレイリストが見つかりません
              </p>
            )}
          </>
        )}

        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="preview" className="border-green-800/50">
            <AccordionTrigger className="text-green-400 hover:no-underline">
              プレイリストの詳細を表示
            </AccordionTrigger>
            <AccordionContent>
              {isPending ? (
                <p className="text-gray-400">読み込み中...</p>
              ) : (
                <PlaylistTreePreview
                  definition={definition.value}
                  playlists={playlists ?? []}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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

function PlaylistTreePreview({
  definition,
  playlists,
}: {
  definition: StructuredPlaylistsDefinition;
  playlists: Playlist[];
}) {
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {definition.playlists.map((playlistDef, index) => (
        <PlaylistTreeNodePreview
          key={`${playlistDef.id}-${index}`}
          playlistDef={playlistDef}
          playlists={playlists}
          depth={0}
        />
      ))}
    </div>
  );
}

type PlaylistDefinition = StructuredPlaylistsDefinition["playlists"][number];

function PlaylistTreeNodePreview({
  playlistDef,
  playlists,
  depth,
}: {
  playlistDef: PlaylistDefinition;
  playlists: Playlist[];
  depth: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const playlist = playlists.find((p) => p.id === playlistDef.id);
  const hasChildren =
    playlistDef.dependencies && playlistDef.dependencies.length > 0;
  const indentSize = depth * 16;

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 rounded-md bg-gray-800/50 p-2"
        style={{ marginLeft: indentSize }}
      >
        {hasChildren ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="h-6 w-6" />
        )}

        {playlist ? (
          <>
            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
              <Image
                src={playlist.thumbnailUrl || "/assets/ogp.png"}
                alt={playlist.title}
                fill
                className="object-cover"
              />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm text-white">
              {playlist.title}
            </span>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Music className="h-3 w-3" />
              <span>{playlist.itemsTotal}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-yellow-900/50">
              <TriangleAlert className="h-4 w-4 text-yellow-500" />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm text-yellow-400">
              Unknown Playlist
            </span>
            <span className="text-gray-500 text-xs">{playlistDef.id}</span>
          </>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {playlistDef.dependencies?.map((childDef, index) => (
            <PlaylistTreeNodePreview
              key={`${childDef.id}-${index}`}
              playlistDef={childDef}
              playlists={playlists}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const _StructuredPlaylistsDefinitionValidationErrorMessages: Record<
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
