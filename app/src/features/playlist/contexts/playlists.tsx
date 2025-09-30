"use client";
import { createContext, type PropsWithChildren, use, useState } from "react";
import type { StateDispatcher } from "@/presentation/common/types";
import type { Playlist } from "../entities/playlist";

type Playlists = Playlist[];

type PlaylistsContextType = {
  playlists: Playlists;
  setPlaylists: StateDispatcher<Playlists>;
};

const PlaylistsContext = createContext<PlaylistsContextType>({
  playlists: [],
  setPlaylists: () => {
    throw new Error(
      "The PlaylistsContext#setPlaylists function called before the context was initialized. This is a bug.",
    );
  },
});

export function PlaylistsContextProvider({
  children,
  defaultPlaylists,
}: PropsWithChildren<{
  defaultPlaylists?: Playlist[];
}>) {
  const [playlists, setPlaylists] = useState<Playlists>(defaultPlaylists ?? []);

  return (
    <PlaylistsContext.Provider value={{ playlists, setPlaylists }}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists() {
  return use(PlaylistsContext);
}
