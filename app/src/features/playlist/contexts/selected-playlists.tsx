"use client";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useState,
} from "react";
import type { StateDispatcher } from "@/components/types";
import type { PlaylistId } from "@/entities/ids";

type SelectedPlaylistsContextType = {
  selectedPlaylists: PlaylistId[];
  setSelectedPlaylists: StateDispatcher<PlaylistId[]>;
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
  defaultSelectedPlaylists?: PlaylistId[];
}>) {
  const [selectedPlaylists, setSelectedPlaylists] = useState<PlaylistId[]>(
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
  playlistId: PlaylistId,
  prev: PlaylistId[],
): PlaylistId[] {
  if (prev.includes(playlistId)) {
    return prev.filter((id) => id !== playlistId);
  } else {
    return [...prev, playlistId];
  }
}

export function useTogglePlaylistSelection() {
  const { setSelectedPlaylists } = useSelectedPlaylists();

  return useCallback(
    (playlistId: PlaylistId) => {
      setSelectedPlaylists((prev) =>
        togglePlaylistSelectionReducer(playlistId, prev),
      );
    },
    [setSelectedPlaylists],
  );
}
