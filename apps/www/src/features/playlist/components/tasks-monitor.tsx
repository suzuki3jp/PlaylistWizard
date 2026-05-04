"use client";
import { JobStatus, JobType } from "@playlistwizard/playlist-action-job";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Filter,
  GitMerge,
  Import,
  ListX,
  Plus,
  Shuffle,
  RefreshCw as SyncIcon,
  Trash,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { unreachable } from "@/lib/unreachable";
import { useT } from "@/presentation/hooks/t/client";
import type { UUID } from "@/usecase/actions/generateUUID";
import type { BackendJob } from "@/usecase/actions/get-backend-jobs";
import { useTask } from "../contexts/tasks";
import { useBackendJobs } from "../hooks/useBackendJobs";
import { useInvalidatePlaylistsQuery } from "../queries/use-playlists";

export enum TaskType {
  Create = "create",
  Copy = "copy",
  Shuffle = "shuffle",
  Merge = "merge",
  Extract = "extract",
  Delete = "delete",
  Deduplicate = "deduplicate",
  Import = "import",
  Sync = "sync",
}

export enum TaskStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Error = "error",
}

export interface Task {
  id: UUID;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  message: string;
}

function jobStatusToTaskStatus(status: JobStatus): TaskStatus {
  switch (status) {
    case JobStatus.Pending:
      return TaskStatus.Pending;
    case JobStatus.Running:
      return TaskStatus.Processing;
    case JobStatus.Completed:
      return TaskStatus.Completed;
    case JobStatus.Failed:
      return TaskStatus.Error;
  }
}

function jobProgress(job: BackendJob): number {
  if (job.status === JobStatus.Completed) return 100;
  if (job.totalSteps === 0) return 0;
  return Math.round((job.completeSteps / job.totalSteps) * 100);
}

export function TasksMonitor({ lang }: { lang: string }) {
  const { t } = useT(lang);
  const {
    tasks,
    dispatchers: { removeAllTasks, removeTask },
  } = useTask();
  const { data: backendJobs = [] } = useBackendJobs();
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();
  const invalidatedBackendJobIds = useRef(new Set<string>());

  const hasItems = tasks.length > 0 || backendJobs.length > 0;

  useEffect(() => {
    const completedCreateJobs = backendJobs.filter(
      (job) =>
        job.type === JobType.Create && job.status === JobStatus.Completed,
    );
    const shouldInvalidate = completedCreateJobs.some((job) => {
      if (invalidatedBackendJobIds.current.has(job.id)) return false;
      invalidatedBackendJobIds.current.add(job.id);
      return true;
    });

    if (shouldInvalidate) {
      void invalidatePlaylistsQuery();
    }
  }, [backendJobs, invalidatePlaylistsQuery]);

  function getTaskIcon(type: TaskType) {
    switch (type) {
      case TaskType.Create:
        return <Plus className="h-4 w-4" />;
      case TaskType.Copy:
        return <Copy className="h-4 w-4" />;
      case TaskType.Shuffle:
        return <Shuffle className="h-4 w-4" />;
      case TaskType.Merge:
        return <GitMerge className="h-4 w-4" />;
      case TaskType.Extract:
        return <Filter className="h-4 w-4" />;
      case TaskType.Delete:
        return <Trash className="h-4 w-4" />;
      case TaskType.Deduplicate:
        return <ListX className="h-4 w-4" />;
      case TaskType.Import:
        return <Import className="h-4 w-4" />;
      case TaskType.Sync:
        return <SyncIcon className="h-4 w-4" />;
      default:
        unreachable(type);
    }
  }

  function getBackendJobIcon(type: JobType) {
    switch (type) {
      case JobType.Create:
        return <Plus className="h-4 w-4" />;
    }
  }

  function getBackendJobMessage(job: BackendJob): string {
    switch (job.type) {
      case JobType.Create:
        return t("task-progress.backend-job.create");
      default:
        return job.type;
    }
  }

  function getTaskStatusIcon(status: TaskStatus) {
    switch (status) {
      case TaskStatus.Completed:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case TaskStatus.Error:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }

  function getStatusColorClass(status: TaskStatus) {
    switch (status) {
      case TaskStatus.Processing:
        return "bg-blue-500";
      case TaskStatus.Completed:
        return "bg-green-500";
      case TaskStatus.Error:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }

  return hasItems ? (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">
          {t("task-progress.common.title")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          onClick={() => removeAllTasks()}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("task-progress.common.close")}</span>
        </Button>
      </div>
      <div className="max-h-60 space-y-3 overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-md bg-gray-900 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`rounded-full p-1.5 ${getStatusColorClass(task.status)}`}
                >
                  {getTaskIcon(task.type)}
                </div>
                <span className="text-sm text-white">{task.message}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getTaskStatusIcon(task.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => removeTask(task.id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">
                    {t("task-progress.common.delete")}
                  </span>
                </Button>
              </div>
            </div>
            <Progress
              value={task.progress}
              className="h-2"
              indicatorClassName={
                task.status === "processing"
                  ? "bg-blue-500"
                  : task.status === "completed"
                    ? "bg-green-500"
                    : task.status === "error"
                      ? "bg-red-500"
                      : ""
              }
            />
            <div className="mt-1 flex justify-between">
              <span className="text-gray-400 text-xs">
                {task.status === "processing"
                  ? t("task-progress.common.processing")
                  : task.status === "completed"
                    ? t("task-progress.common.completed")
                    : task.status === "error"
                      ? t("task-progress.common.error")
                      : t("task-progress.common.pending")}
              </span>
              <span className="text-gray-400 text-xs">
                {Math.round(task.progress)}%
              </span>
            </div>
          </div>
        ))}
        {backendJobs.map((job) => {
          const taskStatus = jobStatusToTaskStatus(job.status);
          const progress = jobProgress(job);
          return (
            <div key={job.id} className="rounded-md bg-gray-900 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`rounded-full p-1.5 ${getStatusColorClass(taskStatus)}`}
                  >
                    {getBackendJobIcon(job.type)}
                  </div>
                  <span className="text-sm text-white">
                    {getBackendJobMessage(job)}
                  </span>
                </div>
                {getTaskStatusIcon(taskStatus)}
              </div>
              <Progress
                value={progress}
                className="h-2"
                indicatorClassName={
                  taskStatus === TaskStatus.Processing
                    ? "bg-blue-500"
                    : taskStatus === TaskStatus.Completed
                      ? "bg-green-500"
                      : taskStatus === TaskStatus.Error
                        ? "bg-red-500"
                        : ""
                }
              />
              <div className="mt-1 flex justify-between">
                <span className="text-gray-400 text-xs">
                  {taskStatus === TaskStatus.Processing
                    ? t("task-progress.common.processing")
                    : taskStatus === TaskStatus.Completed
                      ? t("task-progress.common.completed")
                      : taskStatus === TaskStatus.Error
                        ? t("task-progress.common.error")
                        : t("task-progress.common.pending")}
                </span>
                <span className="text-gray-400 text-xs">
                  {job.completeSteps} / {job.totalSteps}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;
}
