"use client";

import { useT } from "@/presentation/hooks/t/client";
import { usePlaylists } from "../contexts/playlists";
import { PlaylistCard, PlaylistImportingCard } from "./playlist-card";

export function Playlists() {
  const { t } = useT();
  const { playlists } = usePlaylists();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlistId={playlist.id} t={t} />
      ))}
      <PlaylistImportingCard t={t} />
    </div>
  );
}
