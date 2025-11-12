"use client";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useState,
} from "react";
import type { StateDispatcher } from "@/presentation/common/types";

type SelectedPlaylistsContextType = {
  selectedPlaylists: string[];
  setSelectedPlaylists: StateDispatcher<string[]>;
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
  defaultSelectedPlaylists?: string[];
}>) {
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>(
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
  playlistId: string,
  prev: string[],
): string[] {
  if (prev.includes(playlistId)) {
    return prev.filter((id) => id !== playlistId);
  } else {
    return [...prev, playlistId];
  }
}

export function useTogglePlaylistSelection() {
  const { setSelectedPlaylists } = useSelectedPlaylists();

  return useCallback(
    (playlistId: string) => {
      setSelectedPlaylists((prev) =>
        togglePlaylistSelectionReducer(playlistId, prev),
      );
    },
    [setSelectedPlaylists],
  );
}
