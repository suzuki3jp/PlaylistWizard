"use client";
import {
    SiSpotify as Spotify,
    SiYoutubemusic as YouTubeMusic,
} from "@icons-pack/react-simple-icons";
import { Music, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import type { WithT } from "@/@types";
import { PlaylistManager } from "@/actions/playlist-manager";
import type { IAdapterFullPlaylist } from "@/adapters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { providerToAdapterType } from "@/helpers/providerToAdapterType";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/client";
import { Link } from "./link";

interface PlaylistBrowserProps {
    lang: string;
    playlistId: string;
}

export function PlaylistBrowser({ lang, playlistId }: PlaylistBrowserProps) {
    const { t } = useT(lang);
    const [searchQuery, setSearchQuery] = useState("");
    const auth = useAuth();
    const [playlist, setPlaylist] = useState<IAdapterFullPlaylist | null>(null);

    const fetchFullPlaylist = useCallback(async () => {
        if (!auth) return;
        const manager = new PlaylistManager(
            auth.accessToken,
            providerToAdapterType(auth.provider),
        );
        const playlist = await manager.getFullPlaylist(playlistId);
        if (playlist.isOk()) {
            setPlaylist(playlist.value);
        } else if (playlist.error.status === 404) {
        } else {
            signOut({ callbackUrl: "/" });
        }
    }, [auth, playlistId]);

    useEffect(() => {
        fetchFullPlaylist();
    }, [fetchFullPlaylist]);

    function searchFilter(item: IAdapterFullPlaylist["items"][number]) {
        const query = searchQuery.toLowerCase();
        return (
            item.title.toLowerCase().includes(query) ||
            item.author.toLowerCase().includes(query)
        );
    }

    return playlist ? (
        <div
            key={playlist.id}
            className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-lg"
        >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-pink-600 p-2">
                        <Music className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        {playlist.title}
                    </h2>
                </div>
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={t("playlist-browser.search-placeholder")}
                        className="pl-8 bg-gray-800 border-gray-700 text-white focus:border-pink-500 selection:bg-pink-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto relative">
                <table className="w-full">
                    <thead className="bg-gray-800 sticky top-0 z-20">
                        <tr>
                            <th className="w-12 p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800">
                                #
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800">
                                {t("common.title")}
                            </th>
                            <th className="p-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-12 bg-gray-800">
                                <span className="sr-only">
                                    {t("common.platform")}
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {playlist.items
                            .filter(searchFilter)
                            .map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-800/50 transition-colors group"
                                >
                                    <td className="p-3 text-sm font-medium text-gray-300 whitespace-nowrap">
                                        {index + 1}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 mr-3 relative overflow-hidden rounded">
                                                <Image
                                                    src={item.thumbnailUrl}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {item.title}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {item.author}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <Link href={item.url} openInNewTab>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                >
                                                    {auth?.provider ===
                                                    "google" ? (
                                                        <YouTubeMusic className="h-5 w-5 text-red-600" />
                                                    ) : (
                                                        <Spotify className="h-5 w-5 text-[#1DB954]" />
                                                    )}
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    ) : (
        <PlaylistBrowserSkeleton t={t} />
    );
}

function PlaylistBrowserSkeleton({ t }: WithT) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-40" />
                </div>
                <div className="relative w-full max-w-xs">
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto relative">
                <table className="w-full">
                    <thead className="bg-gray-800 sticky top-0 z-20">
                        <tr>
                            <th className="w-12 p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800">
                                #
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800">
                                {t("common.title")}
                            </th>
                            <th className="p-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-12 bg-gray-800">
                                <span className="sr-only">
                                    {t("common.platform")}
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {Array(10)
                            .fill(0)
                            .map((_, index) => (
                                <tr
                                    key={`skeleton-item-${
                                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                        index
                                    }`}
                                    className="bg-gray-800/50"
                                >
                                    <td className="p-3">
                                        <Skeleton className="h-4 w-4" />
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center">
                                            <Skeleton className="h-10 w-10 mr-3 rounded" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
