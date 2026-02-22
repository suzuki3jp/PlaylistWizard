"use client";
import { SnackbarProvider } from "notistack";

import type { Playlist } from "@/features/playlist/entities";
import { useFetchState } from "@/lib/hooks/use-fetch-state";
import { useT } from "@/presentation/hooks/t/client";
import { DependencyTree } from "./dependency-tree";
import { PlaylistList } from "./playlist-list";

export type PlaylistFetchState = ReturnType<
  typeof useFetchState<Playlist[] | null>
>;

export function StructuredPlaylistEditor({ lang }: { lang: string }) {
  const { t } = useT("structured-playlists");
  const playlistFetchState = useFetchState<Playlist[] | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <SnackbarProvider>
        <PlaylistList
          lang={lang}
          t={t}
          playlistFetchState={playlistFetchState}
        />
        <DependencyTree t={t} playlistFetchState={playlistFetchState} />
      </SnackbarProvider>
    </div>
  );
}
