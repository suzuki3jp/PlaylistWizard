"use client";
import { createContext, type PropsWithChildren, use, useState } from "react";
import type { StateDispatcher } from "@/presentation/common/types";
import type { PlaylistInterface } from "../playlist";

type Playlists = Record<string, PlaylistInterface>;

type PlaylistsContextType = {
  playlists: Playlists | null;
  setPlaylists: StateDispatcher<Playlists | null>;
};

const PlaylistsContext = createContext<PlaylistsContextType>({
  playlists: null,
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
  defaultPlaylists?: Playlists;
}>) {
  const [playlists, setPlaylists] = useState<Playlists | null>(
    defaultPlaylists || null,
  );

  return (
    <PlaylistsContext.Provider value={{ playlists, setPlaylists }}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists() {
  return use(PlaylistsContext);
}
