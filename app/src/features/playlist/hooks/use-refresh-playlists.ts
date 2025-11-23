"use client";

import { useAuth } from "@/presentation/hooks/useAuth";
import { usePlaylists } from "../contexts/playlists";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { getMinePlaylists } from "../get-mine-playlists";

export function useRefreshPlaylists() {
  const { setPlaylists } = usePlaylists();
  const { setSelectedPlaylists } = useSelectedPlaylists();
  const auth = useAuth();

  return async () => {
    if (!auth) return;
    const playlists = await getMinePlaylists(auth.accessToken, auth.provider);
    setPlaylists(playlists);
    setSelectedPlaylists([]);
  };
}
