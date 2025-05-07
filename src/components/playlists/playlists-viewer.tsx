"use client";
import {
    SiSpotify as Spotify,
    SiYoutubemusic as YouTubeMusic,
} from "@icons-pack/react-simple-icons";
import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";

import type { WithT } from "@/@types";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "../link";
import type { PlaylistState } from "./playlists-root";

export interface PlaylistsViewerProps extends WithT {
    playlists: PlaylistState[];
    setPlaylists: Dispatch<SetStateAction<PlaylistState[]>>;
    searchQuery: string;
}

export function PlaylistsViewer({
    t,
    playlists,
    setPlaylists,
    searchQuery,
}: PlaylistsViewerProps) {
    const filteredPlaylists = playlists.filter((playlist) =>
        playlist.data.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    function togglePlaylistSelection(id: string) {
        setPlaylists((prev) =>
            prev.map((playlist) => {
                if (playlist.data.id === id) {
                    return {
                        ...playlist,
                        isSelected: !playlist.isSelected,
                    };
                }
                return playlist;
            }),
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredPlaylists.map((playlist) => (
                <PlaylistCard
                    key={playlist.data.id}
                    t={t}
                    playlist={playlist}
                    togglePlaylistSelection={togglePlaylistSelection}
                />
            ))}
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
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <div
            key={playlist.data.id}
            className={`group relative overflow-hidden rounded-lg border transition-all duration-300 cursor-pointer ${
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
                        <div className="absolute top-2 right-2 bg-red-600 rounded-full p-0.5">
                            <YouTubeMusic />
                        </div>
                    ) : (
                        <div className="absolute top-2 right-2 bg-green-600 rounded-full p-0.5">
                            <Spotify />
                        </div>
                    )}
                </Link>
                {playlist.isSelected && (
                    <div className="absolute top-2 left-2 bg-pink-500 rounded-full p-1">
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
                <h3 className="font-medium text-white truncate">
                    {playlist.data.title}
                </h3>
                <p className="text-sm text-gray-400">
                    {t("playlists.video-count", {
                        count: playlist.data.itemsTotal,
                    })}
                </p>
            </div>
        </div>
    );
}
