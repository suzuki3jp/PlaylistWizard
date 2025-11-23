"use client";
import { createContext, type PropsWithChildren, use, useState } from "react";
import { generateUUID, type UUID } from "@/usecase/actions/generateUUID";
import { type Task, TaskStatus } from "../components/tasks-monitor";

export interface TaskDispatchers {
  createTask: (type: Task["type"], firstMessage: string) => Promise<UUID>;
  removeTask: (id: Task["id"]) => void;
  removeAllTasks: () => void;
  updateTaskMessage: (id: Task["id"], message: string) => void;
  updateTaskProgress: (id: Task["id"], progress: number) => void;
  updateTaskStatus: (id: Task["id"], status: Task["status"]) => void;
}

export const TaskContext = createContext<{
  tasks: Task[];
  dispatchers: TaskDispatchers;
}>({
  tasks: [],
  dispatchers: {
    createTask: makeTaskdispatcherInitializationError(
      "TaskDispatchersContext.createTask",
    ),
    removeTask: makeTaskdispatcherInitializationError(
      "TaskDispatchersContext.removeTask",
    ),
    removeAllTasks: makeTaskdispatcherInitializationError(
      "TaskDispatchersContext.removeAllTasks",
    ),
    updateTaskMessage: makeTaskdispatcherInitializationError(
      "TaskDispatchersContext.updateMessage",
    ),
    updateTaskProgress: makeTaskdispatcherInitializationError(
      "TaskDispatchersContext.updateProgress",
    ),
    updateTaskStatus: makeTaskdispatcherInitializationError(
      "TaskDispatchersContext.updateStatus",
    ),
  },
});

export function TaskProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Define the task dispatchers
  const dispatchers: TaskDispatchers = {
    createTask: async (type, firstMessage) => {
      const newTask: Task = {
        id: await generateUUID(),
        type,
        status: TaskStatus.Processing,
        progress: 0,
        message: firstMessage,
      };
      setTasks((prevTasks) => [...prevTasks, newTask]);

      return newTask.id;
    },

    removeTask: (id: Task["id"]) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    },

    removeAllTasks: () => {
      setTasks([]);
    },

    updateTaskMessage: (id, message) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, message } : task)),
      );
    },

    updateTaskProgress: (id, progress) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, progress } : task,
        ),
      );
    },

    updateTaskStatus: (id, status) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, status } : task)),
      );
    },
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        dispatchers,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  return use(TaskContext);
}

function makeTaskdispatcherInitializationError(name: string) {
  return throwContextInitializationError.bind(null, name);
}

function throwContextInitializationError(name: string): never {
  throw new Error(
    `The ${name} function called before the context was initialized. This is a bug.`,
  );
}
