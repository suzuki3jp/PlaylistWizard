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
    setPinnedIds((prev) => {
      if (prev.includes(playlistId)) return prev;
      return [...prev, playlistId];
    });
    try {
      await pinPlaylist(playlistId, provider);
    } catch (error) {
      setPinnedIds((prev) => prev.filter((id) => id !== playlistId));
      throw error;
    }
  };

  const unpin = async (playlistId: string, provider: string) => {
    setPinnedIds((prev) => prev.filter((id) => id !== playlistId));
    try {
      await unpinPlaylist(playlistId, provider);
    } catch (error) {
      setPinnedIds((prev) => {
        if (prev.includes(playlistId)) return prev;
        return [...prev, playlistId];
      });
      throw error;
    }
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
