"use client";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { PlaylistManager } from "@/usecase/actions/playlist-manager";
import { usePlaylists } from "./contexts";
import { PlaylistOperations } from "./operations";
import { PlaylistsViewer } from "./playlists-viewer";
import { TaskMonitor } from "./task-monitor";

interface PlaylistsProps {
  lang: string;
}

export function Playlists({ lang }: PlaylistsProps) {
  const auth = useAuth();
  const { t } = useT(lang);
  const [searchQuery, setSearchQuery] = useState("");
  const { setPlaylists } = usePlaylists();

  const refreshPlaylists = useCallback(async () => {
    if (!auth) return;
    const playlists = await new PlaylistManager(
      auth.accessToken,
      auth.provider,
    ).getPlaylists();

    if (playlists.isOk()) {
      setPlaylists(
        playlists.value.map((playlist) => ({
          data: playlist,
          isSelected: false,
        })),
      );
    } else if (playlists.error.status === 404) {
      setPlaylists([]);
    } else {
      signOut({ callbackUrl: makeLocalizedUrl(lang, "/sign-in") });
    }
  }, [auth, lang, setPlaylists]);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  return (
    <>
      <TaskMonitor t={t} />
      <PlaylistOperations
        t={t}
        refreshPlaylists={refreshPlaylists}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <PlaylistsViewer
        t={t}
        searchQuery={searchQuery}
        refreshPlaylists={refreshPlaylists}
      />
    </>
  );
}
