"use client";
import {
  SiSpotify as Spotify,
  SiYoutubemusic as YouTubeMusic,
} from "@icons-pack/react-simple-icons";
import Image from "next/image";

import type { WithT } from "@/lib/types/t";
import { Link } from "@/presentation/common/link";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Skeleton } from "@/presentation/shadcn/skeleton";
import { type PlaylistState, usePlaylists } from "./contexts";
import { ImportPlaylistCard } from "./import-card";

export interface PlaylistsViewerProps extends WithT {
  searchQuery: string;
  refreshPlaylists: () => Promise<void>;
}

export function PlaylistsViewer({
  t,
  searchQuery,
  refreshPlaylists,
}: PlaylistsViewerProps) {
  const { playlists, setPlaylists } = usePlaylists();

  const filteredPlaylists = playlists?.filter((playlist) =>
    playlist.data.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function togglePlaylistSelection(id: string) {
    setPlaylists(
      (prev) =>
        prev?.map((playlist) => {
          if (playlist.data.id === id) {
            return {
              ...playlist,
              isSelected: !playlist.isSelected,
            };
          }
          return playlist;
        }) || null,
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {!Array.isArray(playlists)
        ? Array(7)
            .fill(0)
            .map((_) => <PlaylistSkeleton key={crypto.randomUUID()} />)
        : filteredPlaylists?.map((playlist) => (
            <PlaylistCard
              key={playlist.data.id}
              t={t}
              playlist={playlist}
              togglePlaylistSelection={togglePlaylistSelection}
            />
          ))}
      <ImportPlaylistCard t={t} refreshPlaylists={refreshPlaylists} />
    </div>
  );
}

interface PlaylistCardProps extends WithT {
  playlist: PlaylistState;
  togglePlaylistSelection: (id: string) => void;
}

function PlaylistCard({
  t,
  playlist,
  togglePlaylistSelection,
}: PlaylistCardProps) {
  const auth = useAuth();
  if (!auth) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: TODO
    // biome-ignore lint/a11y/noStaticElementInteractions: TODO
    <div
      key={playlist.data.id}
      className={`group relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-300 ${
        playlist.isSelected
          ? "border-pink-500 bg-gray-800/80"
          : "border-gray-800 bg-gray-800/50 hover:border-gray-700"
      }`}
      onClick={() => togglePlaylistSelection(playlist.data.id)}
    >
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        <Image
          src={playlist.data.thumbnailUrl || "/placeholder.svg"}
          alt={playlist.data.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <Link href={playlist.data.url} openInNewTab>
          {auth.provider === "google" ? (
            <div className="absolute top-2 right-2 rounded-full bg-red-600 p-0.5">
              <YouTubeMusic />
            </div>
          ) : (
            <div className="absolute top-2 right-2 rounded-full bg-green-600 p-0.5">
              <Spotify />
            </div>
          )}
        </Link>
        {playlist.isSelected && (
          <div className="absolute top-2 left-2 rounded-full bg-pink-500 p-1">
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>selected icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate font-medium text-white">
          {playlist.data.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {t("playlists.video-count", {
            count: playlist.data.itemsTotal,
          })}
        </p>
      </div>
    </div>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-800/50">
      <div className="relative aspect-video rounded-t-lg">
        <Skeleton className="absolute inset-0" />
        <div className="absolute top-2 right-2">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
