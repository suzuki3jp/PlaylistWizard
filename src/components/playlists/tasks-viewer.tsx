"use client";
import {
    AlertCircle,
    CheckCircle,
    Copy,
    FileDown,
    GitMerge,
    Import,
    Shuffle,
    Trash,
    X,
} from "lucide-react";

import type { WithT } from "@/@types";
import type { UUID } from "@/actions/generateUUID";
import type { TaskFunctions } from "@/components/playlists/playlists-root";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface Task {
    id: UUID;
    type: "copy" | "shuffle" | "merge" | "export" | "delete" | "import";
    status: "pending" | "processing" | "completed" | "error";
    progress: number;
    message: string;
}

interface TasksViewerProps extends WithT {
    tasks: Task[];
    removeTask: TaskFunctions["removeTask"];
    removeAllTasks: TaskFunctions["removeAllTasks"];
}

export function TasksViewer({
    t,
    tasks,
    removeAllTasks,
    removeTask,
}: TasksViewerProps) {
    function getTaskIcon(type: Task["type"]) {
        switch (type) {
            case "copy":
                return <Copy className="h-4 w-4" />;
            case "shuffle":
                return <Shuffle className="h-4 w-4" />;
            case "merge":
                return <GitMerge className="h-4 w-4" />;
            case "export":
                return <FileDown className="h-4 w-4" />;
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
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">
                    {t("task-progress.common.title")}
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    onClick={() => removeAllTasks()}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">
                        {t("task-progress.common.close")}
                    </span>
                </Button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {tasks.map((task) => (
                    <div key={task.id} className="bg-gray-900 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`p-1.5 rounded-full ${
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
                                <span className="text-sm text-white">
                                    {task.message}
                                </span>
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
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-400">
                                {task.status === "processing"
                                    ? t("task-progress.common.processing")
                                    : task.status === "completed"
                                      ? t("task-progress.common.completed")
                                      : task.status === "error"
                                        ? t("task-progress.common.error")
                                        : t("task-progress.common.pending")}
                            </span>
                            <span className="text-xs text-gray-400">
                                {Math.round(task.progress)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ) : null;
}
