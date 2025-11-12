"use client";
import {
  SiSpotify as Spotify,
  SiYoutubemusic as YouTubeMusic,
} from "@icons-pack/react-simple-icons";
import Image from "next/image";
import { useEffect } from "react";
import type { WithT } from "@/lib/types/t";
import { Link } from "@/presentation/common/link";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Skeleton } from "@/presentation/shadcn/skeleton";
import { usePlaylists } from "../contexts/playlists";
import {
  useSelectedPlaylists,
  useTogglePlaylistSelection,
} from "../contexts/selected-playlists";
import { signOutWithCallbackToPlaylists } from "../utils/sign-out-with-callback-to-playlists";

interface PlaylistCardProps {
  playlistId: string;
}

export function PlaylistCard({ playlistId, t }: PlaylistCardProps & WithT) {
  const { playlists } = usePlaylists();
  const { selectedPlaylists } = useSelectedPlaylists();
  const togglePlaylistSelection = useTogglePlaylistSelection();
  const auth = useAuth();

  useEffect(() => {
    if (auth === null) {
      // auth is null when user is not properly authenticated
      signOutWithCallbackToPlaylists();
    }
  }, [auth]);

  const targetPlaylist = playlists.find((p) => p.id === playlistId);
  if (!targetPlaylist) return null;

  const isSelected = selectedPlaylists.some((pId) => pId === playlistId);

  if (!auth) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: TODO
    // biome-ignore lint/a11y/noStaticElementInteractions: TODO
    <div
      key={targetPlaylist.id}
      className={`group relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-300 ${
        isSelected
          ? "border-pink-500 bg-gray-800/80"
          : "border-gray-800 bg-gray-800/50 hover:border-gray-700"
      }`}
      onClick={() => togglePlaylistSelection(targetPlaylist.id)}
    >
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        <Image
          src={targetPlaylist.thumbnailUrl || "/placeholder.svg"}
          alt={targetPlaylist.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <Link href={targetPlaylist.url} openInNewTab>
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
        {isSelected && (
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
          {targetPlaylist.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {t("playlists.video-count", {
            count: targetPlaylist.itemsTotal,
          })}
        </p>
      </div>
    </div>
  );
}

export function PlaylistSkeletonCard() {
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
