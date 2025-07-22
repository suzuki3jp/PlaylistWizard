"use client";
import { useAtomValue } from "jotai";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { langAtom } from "@/presentation/atoms";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { FetchMinePlaylistsUsecase } from "@/usecase/fetch-mine-playlists";
import { usePlaylists } from "./contexts";
import { PlaylistOperations } from "./operations";
import { PlaylistsViewer } from "./playlists-viewer";
import { TaskMonitor } from "./task-monitor";

export function Playlists() {
  const lang = useAtomValue(langAtom);
  const auth = useAuth();
  const { t } = useT();
  const [searchQuery, setSearchQuery] = useState("");
  const { setPlaylists } = usePlaylists();

  const refreshPlaylists = useCallback(async () => {
    if (!auth) return;
    const playlists = await new FetchMinePlaylistsUsecase({
      accessToken: auth.accessToken,
      repository: auth.provider,
    }).execute();

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
