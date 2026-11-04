"use client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@playlistwizard/ui";
import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { sleep } from "@/common/sleep";
import { ga4Events } from "@/constants";
import { Provider } from "@/entities/provider";
import { useFocusedAccount } from "@/features/accounts";
import { useStructuredPlaylistsDefinition } from "@/features/structured-playlists-definition/context";
import { useSession } from "@/lib/auth-client";
import { FeatureFlagName } from "@/lib/feature-flags";
import { useT } from "@/presentation/hooks/t/client";
import { useFeatureFlag } from "@/presentation/hooks/useFeatureFlag";
import { enqueueSyncJob } from "@/usecase/actions/enqueue-job";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { SyncStructuredPlaylistsUsecase } from "@/usecase/sync-structured-playlists";
import { useHistory } from "../../contexts/history";
import { useTask } from "../../contexts/tasks";
import { useJobProgress } from "../../job-progress-provider";
import { useInvalidatePlaylistsQuery } from "../../queries/use-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import { StructuredPlaylistsDefinitionPreview } from "../structured-playlists-definition-preview";
import { TaskStatus, TaskType } from "../tasks-monitor";
import type { PlaylistActionComponentProps } from "./types";

function useSyncAction() {
  const { t } = useT("operation");
  const { t: commonT } = useT();
  const { data: session } = useSession();
  const [focusedAccount] = useFocusedAccount();
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
  const isPlaylistActionJobEnabled = useFeatureFlag(
    FeatureFlagName.playlistActionJob,
  );
  const { isReady: isJobProgressReady } = useJobProgress();
  // A ref rather than state so a second click in the same frame is rejected
  // before React re-renders the disabled button.
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [definition] = useStructuredPlaylistsDefinition();
  const isValidDefinition = definition !== null;
  const canSubmit =
    isValidDefinition &&
    !isSubmitting &&
    (!isPlaylistActionJobEnabled || isJobProgressReady);

  async function handleSync() {
    if (isSubmittingRef.current) return;
    if (!window.confirm(commonT("beta-confirm"))) return;
    if (!session || !isValidDefinition || !focusedAccount) {
      setIsOpen(false);
      return;
    }

    if (!isPlaylistActionJobEnabled) {
      setIsOpen(false);
      emitGa4Event(ga4Events.syncPlaylist);
      await syncInBrowser(focusedAccount.id, definition);
      return;
    }

    // Job progress (and the terminal result) is only observable after the
    // initial snapshot, so a dialog left open across a disconnect must not
    // submit even if a click reaches this handler.
    if (!isJobProgressReady) return;
    emitGa4Event(ga4Events.syncPlaylist);
    await enqueueSync(focusedAccount.id, definition);
  }

  /**
   * Hands Sync to the backend Job. Progress and the terminal result are shown
   * by TasksMonitor from Job progress events, so only an enqueue failure is
   * reported here. The in-browser path is never used as a fallback.
   */
  async function enqueueSync(
    accountId: NonNullable<typeof focusedAccount>["id"],
    structureData: NonNullable<typeof definition>,
  ) {
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    let result: Awaited<ReturnType<typeof enqueueSyncJob>>;
    try {
      result = await enqueueSyncJob({ accountId, definition: structureData });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }

    setIsOpen(false);
    if (result.success) return;

    const taskId = await createTask(
      TaskType.Sync,
      t("sync.progress.enqueue-failed", { code: result.status }),
    );
    updateTaskStatus(taskId, TaskStatus.Error);
    await sleep(3000);
    removeTask(taskId);
  }

  async function syncInBrowser(
    accountId: NonNullable<typeof focusedAccount>["id"],
    structureData: NonNullable<typeof definition>,
  ) {
    const jobs = new JobsBuilder();
    const taskId = await createTask(
      TaskType.Sync,
      t("sync.progress.preparing"),
    );

    const result = await new SyncStructuredPlaylistsUsecase({
      repository: Provider.GOOGLE,
      definitionJson: structureData,
      accId: accountId,
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
            accId: accountId,
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

  return { t, isOpen, setIsOpen, definition, canSubmit, handleSync };
}

export default function SyncAction({
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const { t, isOpen, setIsOpen, definition, canSubmit, handleSync } =
    useSyncAction();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PlaylistActionButton disabled={disabled}>
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </PlaylistActionButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
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
            disabled={!canSubmit}
          >
            <Play className="mr-2 h-4 w-4" />
            {t("sync.dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
