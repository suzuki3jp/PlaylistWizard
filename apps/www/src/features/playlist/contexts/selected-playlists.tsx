"use client";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useState,
} from "react";
import type { StateDispatcher } from "@/components/types";
import type { Playlist } from "@/features/playlist/entities";

type SelectedPlaylistsContextType = {
  selectedPlaylists: Playlist[];
  setSelectedPlaylists: StateDispatcher<Playlist[]>;
};

const SelectedPlaylistsContext = createContext<SelectedPlaylistsContextType>({
  selectedPlaylists: [],
  setSelectedPlaylists: () => {
    throw new Error(
      "The SelectedPlaylistsContext#setSelectedPlaylists function called before the context was initialized. This is a bug.",
    );
  },
});

export function SelectedPlaylistsContextProvider({
  children,
  defaultSelectedPlaylists,
}: PropsWithChildren<{
  defaultSelectedPlaylists?: Playlist[];
}>) {
  const [selectedPlaylists, setSelectedPlaylists] = useState<Playlist[]>(
    defaultSelectedPlaylists || [],
  );

  return (
    <SelectedPlaylistsContext.Provider
      value={{ selectedPlaylists, setSelectedPlaylists }}
    >
      {children}
    </SelectedPlaylistsContext.Provider>
  );
}

export function useSelectedPlaylists() {
  return use(SelectedPlaylistsContext);
}

function togglePlaylistSelectionReducer(
  playlist: Playlist,
  prev: Playlist[],
): Playlist[] {
  if (prev.some((p) => p.id === playlist.id)) {
    return prev.filter((p) => p.id !== playlist.id);
  } else {
    return [...prev, playlist];
  }
}

export function useTogglePlaylistSelection() {
  const { setSelectedPlaylists } = useSelectedPlaylists();

  return useCallback(
    (playlist: Playlist) => {
      setSelectedPlaylists((prev) =>
        togglePlaylistSelectionReducer(playlist, prev),
      );
    },
    [setSelectedPlaylists],
  );
}
