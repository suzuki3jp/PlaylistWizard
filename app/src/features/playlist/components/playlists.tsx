"use client";

import { useT } from "@/presentation/hooks/t/client";
import { useSearchQuery } from "../contexts/search";
import { usePlaylistsQuery } from "../queries/use-playlists";
import {
  PlaylistCard,
  PlaylistImportingCard,
  PlaylistSkeletonCard,
} from "./playlist-card";

export function Playlists() {
  const { t } = useT();
  const { searchQuery } = useSearchQuery();
  const { data: playlists, isPending } = usePlaylistsQuery();

  if (isPending) return <PlaylistsSkeleton />;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {playlists
        .filter((playlist) =>
          playlist.title.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .map((playlist) => (
          <PlaylistCard key={playlist.id} playlistId={playlist.id} t={t} />
        ))}
      <PlaylistImportingCard t={t} />
    </div>
  );
}

function PlaylistsSkeleton() {
  const SKELETON_COUNT = 12;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: SKELETON_COUNT }).map(() => (
        <PlaylistSkeletonCard key={crypto.randomUUID()} />
      ))}
    </div>
  );
}
