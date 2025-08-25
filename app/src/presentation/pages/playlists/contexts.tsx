import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

import type { PlaylistInterface } from "@/entity";
import type { StateDispatcher } from "@/presentation/common/types";
import { generateUUID, type UUID } from "@/usecase/actions/generateUUID";

export interface PlaylistState {
  data: PlaylistInterface;
  isSelected: boolean;
}

/**
 * The playlists property is set to null during initial fetching of playlists.
 */
export const PlaylistsContext = createContext<{
  playlists: PlaylistState[] | null;
  setPlaylists: StateDispatcher<PlaylistState[] | null>;
}>({
  playlists: null,
  setPlaylists: () => {
    throwContextInitializationError("PlaylistsContext.setPlaylists");
  },
});

export function PlaylistsProvider({ children }: PropsWithChildren) {
  const [playlists, setPlaylists] = useState<PlaylistState[] | null>(null);

  return (
    <PlaylistsContext.Provider value={{ playlists, setPlaylists }}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists() {
  return useContext(PlaylistsContext);
}

export interface Task {
  id: UUID;
  type: "copy" | "shuffle" | "merge" | "extract" | "delete" | "import" | "sync";
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  message: string;
}

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
        status: "processing",
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
  return useContext(TaskContext);
}

function makeTaskdispatcherInitializationError(name: string) {
  return throwContextInitializationError.bind(null, name);
}

function throwContextInitializationError(name: string): never {
  throw new Error(
    `The ${name} function called before the context was initialized. This is a bug.`,
  );
}
