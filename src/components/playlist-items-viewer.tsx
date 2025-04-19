"use client";
import { Search as SearchIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

import {
    type FullPlaylist,
    type PlaylistItem,
    PlaylistManager,
} from "@/actions";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/shadcn-ui/card";
import { Input } from "@/components/shadcn-ui/input";
import { useT } from "@/hooks";
import { providerToAdapterType } from "@/utils";

/**
 * The Playlist Items Viewer component used in the playlist browser.
 * @param param0
 */
export const PlaylistItemsViewer: React.FC<PlaylistItemsViewerProps> = ({
    id,
}) => {
    const { t } = useT();
    const [playlist, setPlaylist] = useState<FullPlaylist | null>(null);
    const [searchStr, setSearchStr] = useState<string>("");
    const { data } = useSession();

    const refreshPlaylist = useCallback(async () => {
        if (!data?.accessToken || !data?.provider) return;

        const manager = new PlaylistManager(
            data.accessToken,
            providerToAdapterType(data.provider),
        );
        const playlist = await manager.getFullPlaylist(id);
        if (playlist.isErr()) return signOut();
        setPlaylist(playlist.data);
    }, [data, id]);

    useEffect(() => {
        refreshPlaylist();
    }, [refreshPlaylist]);

    const matchesSearch = ({ title, author }: PlaylistItem): boolean => {
        const lowerSearchStr = searchStr.toLowerCase();
        return (
            title.toLowerCase().includes(lowerSearchStr) ||
            author.toLowerCase().includes(lowerSearchStr)
        );
    };

    return playlist ? (
        <Card key={playlist.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-bold tracking-tight">
                    {playlist.title}
                </CardTitle>
                <div className="relative w-full max-w-sm">
                    <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("playlist-browser.search")}
                        value={searchStr}
                        onChange={(e) => setSearchStr(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {playlist.items.filter(matchesSearch).map((item, idx) => (
                    <div
                        key={item.id}
                        className="flex items-center space-x-4 rounded-md p-2"
                    >
                        <div className="min-w-[2ch]">{idx + 1}</div>
                        <Image
                            src={item.thumbnail}
                            alt={`${item.title} thumbnail`}
                            width={48}
                            height={48}
                            className="rounded-sm object-cover"
                            draggable={false}
                        />
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {item.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {item.author}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    ) : null;
};

type PlaylistItemsViewerProps = Readonly<{ id: string }>;
