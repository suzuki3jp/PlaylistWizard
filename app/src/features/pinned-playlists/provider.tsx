"use client";
import { createContext, useContext, useState } from "react";
import { pinPlaylist, unpinPlaylist } from "./actions";

type PinnedPlaylistsContextType = {
  pinnedIds: string[];
  pin: (playlistId: string, provider: string) => Promise<void>;
  unpin: (playlistId: string, provider: string) => Promise<void>;
};

const PinnedPlaylistsContext = createContext<PinnedPlaylistsContextType>({
  pinnedIds: [],
  pin: async () => {
    throw new Error(
      "The PinnedPlaylistsContext#pin function called before the context was initialized. This is a bug.",
    );
  },
  unpin: async () => {
    throw new Error(
      "The PinnedPlaylistsContext#unpin function called before the context was initialized. This is a bug.",
    );
  },
});

interface PinnedPlaylistsProviderProps {
  children: React.ReactNode;
  initialIds: string[];
}

export function PinnedPlaylistsProvider({
  children,
  initialIds,
}: PinnedPlaylistsProviderProps) {
  const [pinnedIds, setPinnedIds] = useState<string[]>(initialIds);

  const pin = async (playlistId: string, provider: string) => {
    await pinPlaylist(playlistId, provider);
    setPinnedIds((prev) => [...prev, playlistId]);
  };

  const unpin = async (playlistId: string, provider: string) => {
    await unpinPlaylist(playlistId, provider);
    setPinnedIds((prev) => prev.filter((id) => id !== playlistId));
  };

  return (
    <PinnedPlaylistsContext.Provider value={{ pinnedIds, pin, unpin }}>
      {children}
    </PinnedPlaylistsContext.Provider>
  );
}

export function usePinnedPlaylists() {
  return useContext(PinnedPlaylistsContext);
}
