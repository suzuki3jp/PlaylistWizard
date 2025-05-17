"use client";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { type UUID, generateUUID } from "@/actions/generateUUID";
import { PlaylistManager } from "@/actions/playlist-manager";
import type { IAdapterPlaylist } from "@/adapters";
import { providerToAdapterType } from "@/helpers/providerToAdapterType";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/client";
import { PlaylistActions } from "./playlists-actions";
import { PlaylistsViewer } from "./playlists-viewer";
import { type Task, TasksViewer } from "./tasks-viewer";

export interface PlaylistsRootProps {
  lang: string;
}

export interface PlaylistState {
  data: IAdapterPlaylist;
  isSelected: boolean;
}

export interface TaskFunctions {
  createTask: (type: Task["type"], firstMessage: string) => Promise<UUID>;
  removeTask: (id: Task["id"]) => void;
  removeAllTasks: () => void;
  updateMessage: (id: Task["id"], message: string) => void;
  updateProgress: (id: Task["id"], progress: number) => void;
  updateStatus: (id: Task["id"], status: Task["status"]) => void;
}

export function PlaylistsRoot({ lang }: PlaylistsRootProps) {
  const auth = useAuth();
  const { t } = useT(lang);
  const [searchQuery, setSearchQuery] = useState("");
  const [playlists, setPlaylists] = useState<PlaylistState[]>([]);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  const refreshPlaylists = useCallback(async () => {
    if (!auth) return;
    const playlists = await new PlaylistManager(
      auth.accessToken,
      providerToAdapterType(auth.provider),
    ).getPlaylists();

    if (playlists.isOk()) {
      setPlaylists(
        playlists.value.map((playlist) => ({
          data: playlist,
          isSelected: false,
        })),
      );
      setIsPlaylistsLoading(false);
    } else if (playlists.error.status === 404) {
      setPlaylists([]);
      setIsPlaylistsLoading(false);
    } else {
      signOut({ callbackUrl: "/" });
    }
  }, [auth]);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  if (!auth) return null;

  const createTask: TaskFunctions["createTask"] = async (
    type,
    firstMessage,
  ) => {
    const newTask: Task = {
      id: await generateUUID(),
      type,
      status: "processing",
      progress: 0,
      message: firstMessage,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);

    return newTask.id;
  };

  const removeTask: TaskFunctions["removeTask"] = (id: Task["id"]) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  const removeAllTasks: TaskFunctions["removeAllTasks"] = () => {
    setTasks([]);
  };

  const updateMessage: TaskFunctions["updateMessage"] = (id, message) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === id ? { ...task, message } : task)),
    );
  };

  const updateProgress: TaskFunctions["updateProgress"] = (id, progress) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === id ? { ...task, progress } : task)),
    );
  };

  const updateStatus: TaskFunctions["updateStatus"] = (id, status) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === id ? { ...task, status } : task)),
    );
  };

  return (
    <>
      <TasksViewer
        t={t}
        tasks={tasks}
        removeAllTasks={removeAllTasks}
        removeTask={removeTask}
      />
      <PlaylistActions
        t={t}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        playlists={playlists}
        refreshPlaylists={refreshPlaylists}
        createTask={createTask}
        updateTaskMessage={updateMessage}
        updateTaskProgress={updateProgress}
        updateTaskStatus={updateStatus}
        removeTask={removeTask}
      />
      <PlaylistsViewer
        t={t}
        playlists={playlists}
        setPlaylists={setPlaylists}
        searchQuery={searchQuery}
        createTask={createTask}
        updateTaskMessage={updateMessage}
        updateTaskProgress={updateProgress}
        updateTaskStatus={updateStatus}
        removeTask={removeTask}
        isLoading={isPlaylistsLoading}
      />
    </>
  );
}
