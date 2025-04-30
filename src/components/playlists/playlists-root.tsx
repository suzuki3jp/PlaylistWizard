"use client";
import { useState } from "react";

import type { IAdapterPlaylist } from "@/adapters";
import { useT } from "@/i18n/client";
import { PlaylistActions } from "./playlists-actions";
import { PlaylistsViewer } from "./playlists-viewer";

export interface PlaylistsRootProps {
    lang: string;
}

export interface PlaylistState {
    data: IAdapterPlaylist;
    isSelected: boolean;
}

export function PlaylistsRoot({ lang }: PlaylistsRootProps) {
    const { t } = useT(lang);
    const [searchQuery, setSearchQuery] = useState("");
    const [playlists, setPlaylists] = useState<PlaylistState[]>([]);

    return (
        <>
            <PlaylistActions
                t={t}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                playlists={playlists}
            />
            <PlaylistsViewer
                t={t}
                playlists={playlists}
                setPlaylists={setPlaylists}
                searchQuery={searchQuery}
            />
        </>
    );
}
