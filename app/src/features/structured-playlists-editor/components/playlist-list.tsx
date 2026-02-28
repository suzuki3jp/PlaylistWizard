"use client";
import type { WithT } from "i18next";
import { Music } from "lucide-react";
import type { DragEvent } from "react";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { Skeleton } from "@/components/ui/skeleton";
import type { Playlist } from "@/features/playlist/entities";
import { usePlaylistsQuery } from "@/features/playlist/queries/use-playlists";

export function PlaylistList({ t }: WithT) {
  const { data: playlists, isPending } = usePlaylistsQuery();

  return (
    <div className="lg:col-span-1">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-4 font-semibold text-lg text-white">
          {t("editor.available-playlists.title")}
        </h3>
        <p className="mb-4 text-gray-400 text-sm">
          {t("editor.available-playlists.description")}
        </p>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {isPending ? (
            <PlaylistListSkeleton />
          ) : playlists && playlists.length > 0 ? (
            playlists.map((playlist) => (
              <PlaylistCard playlist={playlist} key={playlist.id} t={t} />
            ))
          ) : (
            <div className="py-8 text-center text-gray-400">
              <p>プレイリストがないか、取得に失敗しました。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaylistListSkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 flex-shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

function PlaylistListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no stable identity
        <PlaylistListSkeletonCard key={i} />
      ))}
    </div>
  );
}

function PlaylistCard({ playlist, t }: { playlist: Playlist } & WithT) {
  function handleDragStart(e: DragEvent) {
    if (!e.dataTransfer)
      // biome-ignore lint/suspicious/noConsole: Should display an error message
      return console.error("PlaylistCard: DataTransfer is not supported");

    e.dataTransfer.setData("application/json", JSON.stringify(playlist));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div
      className="cursor-grab rounded-lg border border-gray-700 bg-gray-800 p-3 transition-colors hover:border-gray-600 active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
      role="application"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
          <ThumbnailImage
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-medium text-sm text-white">
            {playlist.title}
          </h4>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Music className="h-3 w-3" />
              <span>
                {t("editor.song-count", { count: playlist.itemsTotal })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
