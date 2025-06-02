"use client";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Filter,
  GitMerge,
  Import,
  Shuffle,
  Trash,
  X,
} from "lucide-react";

import type { WithT } from "@/@types";
import { Button } from "@/presentation/shadcn/button";
import { Progress } from "@/presentation/shadcn/progress";
import { type Task, useTask } from "./contexts";

export function TaskMonitor({ t }: WithT) {
  const {
    tasks,
    dispatchers: { removeAllTasks, removeTask },
  } = useTask();

  function getTaskIcon(type: Task["type"]) {
    switch (type) {
      case "copy":
        return <Copy className="h-4 w-4" />;
      case "shuffle":
        return <Shuffle className="h-4 w-4" />;
      case "merge":
        return <GitMerge className="h-4 w-4" />;
      case "extract":
        return <Filter className="h-4 w-4" />;
      case "delete":
        return <Trash className="h-4 w-4" />;
      case "import":
        return <Import className="h-4 w-4" />;
    }
  }

  function getTaskStatusIcon(status: Task["status"]) {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }

  return tasks.length > 0 ? (
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
                  className={`rounded-full p-1.5 ${
                    task.status === "processing"
                      ? "bg-blue-500"
                      : task.status === "completed"
                        ? "bg-green-500"
                        : task.status === "error"
                          ? "bg-red-500"
                          : "bg-gray-500"
                  }`}
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
      </div>
    </div>
  ) : null;
}
