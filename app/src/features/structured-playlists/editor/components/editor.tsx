"use client";
import { SnackbarProvider } from "notistack";

import { useT } from "@/presentation/hooks/t/client";
import { DependencyTree } from "./dependency-tree";
import { PlaylistList } from "./playlist-list";

export function StructuredPlaylistEditor({ lang }: { lang: string }) {
  const { t } = useT("structured-playlists");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <SnackbarProvider>
        <PlaylistList lang={lang} t={t} />
        <DependencyTree t={t} />
      </SnackbarProvider>
    </div>
  );
}
