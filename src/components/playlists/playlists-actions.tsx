"use client";
import { Copy, FileDown, GitMerge, Search, Shuffle, Trash } from "lucide-react";

import type { WithT } from "@/@types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlaylistState } from "./playlists-root";

export interface PlaylistActionsProps extends WithT {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    playlists: PlaylistState[];
}

export function PlaylistActions({
    t,
    searchQuery,
    setSearchQuery,
    playlists,
}: PlaylistActionsProps) {
    const selectedPlaylists = playlists.filter(
        (playlist) => playlist.isSelected,
    );

    return (
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    disabled={selectedPlaylists.length === 0}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    {t("playlists.copy")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    disabled={selectedPlaylists.length === 0}
                >
                    <Shuffle className="mr-2 h-4 w-4" />
                    {t("playlists.shuffle")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    disabled={selectedPlaylists.length < 2}
                >
                    <GitMerge className="mr-2 h-4 w-4" />
                    {t("playlists.merge")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-red-400"
                    disabled={selectedPlaylists.length === 0}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    {t("playlists.delete")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    disabled={selectedPlaylists.length === 0}
                >
                    <Search className="mr-2 h-4 w-4" />
                    {t("playlists.browse")}
                </Button>
            </div>

            <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    placeholder={t("playlists.search-placeholder")}
                    className="pl-8 bg-gray-800 border-gray-700 text-white focus:border-pink-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
    );
}
