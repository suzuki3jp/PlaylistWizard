"use client";
import { createContext, type PropsWithChildren, use, useState } from "react";
import type { StateDispatcher } from "@/presentation/common/types";
import type { PlaylistInterface } from "../playlist";

type Playlists = Record<string, PlaylistInterface>;

type PlaylistContextType = {
  playlists: Playlists | null;
  setPlaylists: StateDispatcher<Playlists | null>;
};

const PlaylistContext = createContext<PlaylistContextType>({
  playlists: null,
  setPlaylists: () => {
    throw new Error(
      "The PlaylistContext#setPlaylists function called before the context was initialized. This is a bug.",
    );
  },
});

export function PlaylistContextProvider({
  children,
  defaultPlaylists,
}: PropsWithChildren<{
  defaultPlaylists?: Playlists;
}>) {
  const [playlists, setPlaylists] = useState<Playlists | null>(
    defaultPlaylists || null,
  );

  return (
    <PlaylistContext.Provider value={{ playlists, setPlaylists }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists() {
  return use(PlaylistContext);
}
